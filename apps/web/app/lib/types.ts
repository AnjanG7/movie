// lib/types.ts - TypeScript types matching Prisma schema

export enum Phase {
  DEVELOPMENT = 'DEVELOPMENT',
  PRODUCTION = 'PRODUCTION',
  POST = 'POST',
  PUBLICITY = 'PUBLICITY'
}

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