import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { Auth } from '@/src/shared/decorators/auth.decorator';
import { Authorized } from '@/src/shared/decorators/authorized.decorator';

import { AccountService } from './account.service';
import { CreateUserInput } from './inputs/create-user.input';
import { UserModel } from './models/user.model';

@Resolver('Account')
export class AccountResolver {
  constructor(private readonly accountService: AccountService) {}

  @Auth()
  @Query(() => UserModel, { name: 'findProfile' })
  async me(@Authorized('id') id: string) {
    return this.accountService.me(id);
  }

  @Mutation(() => Boolean, { name: 'createUser' })
  async create(@Args('data') input: CreateUserInput) {
    return this.accountService.create(input);
  }
}
