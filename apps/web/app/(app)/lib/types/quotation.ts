export interface Quotation {
  id: string;
  projectId: string;
  version: string;
  type: 'QUOTE' | 'BASELINE' | 'WORKING';
  createdBy?: string;
  lockedAt?: string | null;
  acceptedAt?: string | null;
  sentTo?: any;
  template?: string | null;
  assumptions?: QuotationAssumptions;
  financingPlan?: FinancingPlan;
  revenueModel?: RevenueModel;
  metrics?: ROIMetrics;
  grandTotal?: number;
  createdAt: string;
  updatedAt?: string;
  lines?: BudgetLine[];
  project?: {
    id: string;
    title: string;
    baseCurrency: string;
  };
}

export interface QuotationAssumptions {
  currency: string;
  taxPercent: number;
  contingencyPercent: number;
  insurancePercent: number;
  bondPercent: number;
  phases: string[];
}

export interface FinancingPlan {
  sources: FinancingSource[];
}

export interface FinancingSource {
  type: 'EQUITY' | 'LOAN' | 'GRANT' | 'INCENTIVE' | 'MG';
  amount: number;
  rate?: number;
  description?: string;
}

export interface RevenueModel {
  grossRevenue: number;
  distributionFeePercent: number;
  territoryBreakdown?: TerritoryRevenue[];
}

export interface TerritoryRevenue {
  territory: string;
  window: string;
  revenue: number;
}

export interface ROIMetrics {
  totalCost: number;
  projectedRevenue: number;
  distributionFeePercent: number;
  distributionFees: number;
  netRevenue: number;
  profit: number;
  roi: number;
  irr: number;
  npv: number;
  paybackPeriod: number | null;
  breakEvenRevenue: number;
  profitMargin: number;
}

export interface BudgetLine {
  id: string;
  budgetVersionId: string;
  phase: 'DEVELOPMENT' | 'PRODUCTION' | 'POST' | 'PUBLICITY';
  department?: string;
  name: string;
  qty: number;
  rate: number;
  taxPercent?: number;
  vendor?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ScenarioAnalysis {
  pessimistic: ROIMetrics;
  base: ROIMetrics;
  optimistic: ROIMetrics;
}
