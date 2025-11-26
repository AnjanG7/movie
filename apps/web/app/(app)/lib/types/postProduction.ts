export interface PostTask {
  id: string;
  projectId: string;
  name: string;
  type: 'EDITING' | 'COLOR' | 'AUDIO' | 'MUSIC' | 'VFX' | 'QC' | null;
  assigneeId?: string | null;
  vendorId?: string | null;
  costEstimate: number;
  actualCost?: number | null;
  dueDate?: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  notes?: string | null;
  attachments?: any;
  createdAt: string;
  updatedAt?: string;
  project?: {
    id: string;
    title: string;
  };
}

export interface BudgetLine {
  id: string;
  budgetVersionId: string;
  phase: 'POST';
  department?: string | null;
  name: string;
  qty: number;
  rate: number;
  taxPercent: number;
  vendor?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface PostProductionForecast {
  summary: {
    totalEstimated: number;
    totalActual: number;
    totalPaid: number;
    remaining: number;
    variance: number;
    completionPercentage: number;
  };
  budgetLines: {
    count: number;
    total: number;
  };
  tasks: {
    total: number;
    estimated: number;
    actual: number;
    byType: Record<string, {
      count: number;
      estimated: number;
      actual: number;
      pending: number;
      inProgress: number;
      completed: number;
    }>;
    byStatus: Record<string, {
      count: number;
      estimated: number;
      actual: number;
    }>;
  };
}
