import { applyDecorators, UseGuards } from '@nestjs/common';

import { GqlAuthGuard } from '../guards/gql-auth.guard';

export function Auth() {
  return applyDecorators(UseGuards(GqlAuthGuard));
}
