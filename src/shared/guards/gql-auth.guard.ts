import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { Request } from 'express';

import type { User } from '@/prisma/generated';
import { PrismaService } from '@/src/core/prisma/prisma/prisma.service';

@Injectable()
export class GqlAuthGuard implements CanActivate {
  constructor(private readonly prismaService: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext<{ req: Request }>().req;

    if (!request.session?.userId) {
      throw new UnauthorizedException('Not authorized');
    }

    const user: User | null = await this.prismaService.user.findUnique({
      where: {
        id: request.session.userId,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    request.user = user;

    return true;
  }
}
