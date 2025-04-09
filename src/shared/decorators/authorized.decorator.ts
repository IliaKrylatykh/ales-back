import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

import type { User } from '@/prisma/generated';

export const Authorized = createParamDecorator(
  (data: keyof User, ctx: ExecutionContext): any => {
    let user: User | undefined;

    if (ctx.getType() === 'http') {
      const request = ctx
        .switchToHttp()
        .getRequest<Request & { user?: User }>();
      user = request.user;
    } else {
      const context = GqlExecutionContext.create(ctx);
      const request = context.getContext<{ req: { user?: User } }>().req;
      user = request.user;
    }

    return data ? user?.[data] : user;
  },
);
