// ============================================
// Net-On API — @Roles() Decorator
// ============================================

import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Restrict endpoint access to specific user roles.
 * @example @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
