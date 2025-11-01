// lib/types.ts - Types matching Prisma schema exactly

export enum Phase {
  DEVELOPMENT = 'DEVELOPMENT',
  PRODUCTION = 'PRODUCTION',
  POST = 'POST',
  PUBLICITY = 'PUBLICITY'
}

// User & Auth Types (from Prisma schema)
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Role {
  id: string;
  name: string;
  users?: UserRole[];
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  user?: User;
  role?: Role;
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
  user?: User;
}

// Notification type (UI only - not in DB yet)
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

// Existing types...
export interface Project {
  id: string;
  title: string;
  baseCurrency: string;
  timezone?: string;
  status?: string;
  ownerId?: string;
  createdAt: string;
  financingSources?: FinancingSource[];
  phases?: PhaseEntity[];
}

export interface PhaseEntity {
  id: string;
  name: Phase;
  orderNo?: number;
  projectId: string;
  project?: Project;
}

export interface FinancingSource {
  id: string;
  projectId: string;
  type: string;
  amount: number;
  rate?: number;
  fees?: number;
  schedule?: any;
}

export interface Participant {
  id: string;
  waterfallId: string;
  name: string;
  role: string;
  pctShare?: number;
  waterfall?: {
    project?: Project;
  };
  payouts?: WaterfallPayout[];
}

export interface WaterfallPayout {
  id: string;
  participantId: string;
  periodStart: string;
  periodEnd: string;
  amount: number;
}

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalBudget: number;
  totalInvestors: number;
  projectsByPhase: Record<Phase, number>;
}