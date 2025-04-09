import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';

import { Auth } from '@/src/shared/decorators/auth.decorator';
import { UserAgent } from '@/src/shared/decorators/user-agent.decorator';
import type { GqlContext } from '@/src/shared/types/gql-context.types';

import { UserModel } from '../account/models/user.model';

import { LoginInput } from './inputs/login.input';
import { SessionModel } from './models/session.model';
import { SessionService } from './session.service';

@Resolver('Session')
export class SessionResolver {
  constructor(private readonly sessionService: SessionService) {}

  @Auth()
  @Query(() => [SessionModel], { name: 'findSessionsByUser' })
  async findByUser(@Context() { req }: GqlContext) {
    return this.sessionService.findByUser(req);
  }

  @Auth()
  @Query(() => SessionModel, { name: 'findCurrentSession' })
  async findCurrent(@Context() { req }: GqlContext) {
    return this.sessionService.findCurrent(req);
  }

  @Mutation(() => UserModel, { name: 'loginUser' })
  async login(
    @Context() { req }: GqlContext,
    @Args('data') input: LoginInput,
    @UserAgent() userAgent: string,
  ) {
    return this.sessionService.login(req, input, userAgent);
  }

  @Auth()
  @Mutation(() => Boolean, { name: 'logoutUser' })
  async logout(@Context() { req }: GqlContext) {
    return this.sessionService.logout(req);
  }

  @Auth()
  @Mutation(() => Boolean, { name: 'clearSessionCookie' })
  clearSession(@Context() { req }: GqlContext) {
    return this.sessionService.clearSession(req);
  }

  @Auth()
  @Mutation(() => Boolean, { name: 'removeSession' })
  async remove(@Context() { req }: GqlContext, @Args('id') id: string) {
    return this.sessionService.remove(req, id);
  }
}
