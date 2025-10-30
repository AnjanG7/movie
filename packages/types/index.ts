// Instead of importing Prisma client directly, import Prisma namespace for typing only
import { Prisma } from '@prisma/client';

// Export only the types you need
export type User = Prisma.UserGetPayload<{}>;
export type Role = Prisma.RoleGetPayload<{}>;
export type UserRole = Prisma.UserRoleGetPayload<{}>;
export type AuditLog = Prisma.AuditLogGetPayload<{}>;
