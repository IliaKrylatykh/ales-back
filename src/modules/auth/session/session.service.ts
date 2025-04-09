import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verify } from 'argon2';
import type { Request } from 'express';
import { SessionData } from 'express-session';

import { PrismaService } from '@/src/core/prisma/prisma/prisma.service';
import { RedisService } from '@/src/core/redis/redis.service';
import { getSessionMetadata } from '@/src/shared/utils/session-metadata.util';

import { LoginInput } from './inputs/login.input';

@Injectable()
export class SessionService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async findByUser(req: Request) {
    const userId = req.session?.userId;
    const currentSessionId = req.session?.id;

    if (!userId) {
      throw new NotFoundException('User not found');
    }

    const keys = await this.redisService.keys('sessions:*');

    if (!keys.length) {
      return [];
    }

    const sessionDataList = await Promise.all(
      keys.map((key) => this.redisService.get(key)),
    );

    const userSessions = sessionDataList
      .map((data, index): SessionData | null => {
        if (!data) return null;

        try {
          const session = JSON.parse(data) as SessionData;
          if (session.userId === userId) {
            return {
              ...session,
              id: keys[index].split(':')[1],
            };
          }
        } catch {
          return null;
        }

        return null;
      })
      .filter((s): s is SessionData => s !== null);

    userSessions.sort((a, b) => {
      const aDate = new Date(a.createdAt ?? 0).getTime();
      const bDate = new Date(b.createdAt ?? 0).getTime();
      return bDate - aDate;
    });

    return userSessions.filter((session) => session.id !== currentSessionId);
  }

  async findCurrent(req: Request) {
    const sessionId = req.session.id;

    const sessionData = await this.redisService.get(
      `${this.configService.getOrThrow<string>('SESSION_FOLDER')}${sessionId}`,
    );

    if (!sessionData) {
      throw new NotFoundException('Session not found in Redis');
    }

    const session = JSON.parse(sessionData) as SessionData;

    return {
      ...session,
      id: sessionId,
    };
  }

  async login(req: Request, input: LoginInput, userAgent: string) {
    const { login, password } = input;

    const user = await this.prismaService.user.findFirst({
      where: {
        OR: [{ username: { equals: login } }, { email: { equals: login } }],
      },
    });

    if (!user) {
      throw new NotFoundException('User not found TEST!');
    }

    const isValidPassword = await verify(user.password, password);

    if (!isValidPassword) {
      throw new UnauthorizedException('Wrong password TEST!');
    }

    const metadata = getSessionMetadata(req, userAgent);

    return new Promise((resolve, reject) => {
      req.session.createdAt = new Date();
      req.session.userId = user.id;
      req.session.metadata = metadata;

      req.session.save((err) => {
        if (err) {
          return reject(new InternalServerErrorException('Cant save session'));
        }

        resolve(user);
      });
    });
  }

  async logout(req: Request) {
    return new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) {
          return reject(new InternalServerErrorException('Cant end session'));
        }

        req.res?.clearCookie(
          this.configService.getOrThrow<string>('SESSION_NAME'),
        );
        resolve(true);
      });
    });
  }

  clearSession(req: Request) {
    req.res?.clearCookie(this.configService.getOrThrow<string>('SESSION_NAME'));

    return true;
  }

  async remove(req: Request, id: string) {
    if (req.session.id === id) {
      throw new ConflictException('Cant remove current session');
    }

    await this.redisService.del(
      `${this.configService.getOrThrow<string>('SESSION_FOLDER')}${id}`,
    );

    return true;
  }
}
