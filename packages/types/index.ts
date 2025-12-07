// packages/types/index.ts
// Standalone app/domain types – no Prisma dependency

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Role {
  id: string;
  name: string;
}

export interface AuditLog {
  id: string;
  entity: string;
  action: string;
  recordId?: string;
  beforeData?: any;
  afterData?: any;
  userId?: string;
  timestamp: string;
}
