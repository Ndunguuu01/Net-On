// ============================================
// Net-On API — @CurrentUser() Decorator
// ============================================

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extract the authenticated user from the request.
 * @example @CurrentUser() user: { id: string; email: string; role: string }
 * @example @CurrentUser('id') userId: string
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
