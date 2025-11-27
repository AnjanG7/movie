export interface PublicityBudget {
  id: string;
  projectId: string;
  name: string;
  category: PublicityCategory;
  description?: string | null;
  budgetAmount: number;
  actualAmount: number;
  vendor?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: PublicityStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string;
  expenses?: PublicityExpense[];
  campaignEvents?: CampaignEvent[];
  _count?: {
    expenses: number;
    campaignEvents: number;
  };
  project?: {
    id: string;
    title: string;
    baseCurrency: string;
  };
}

export type PublicityCategory =
  | 'TRAILER'
  | 'KEY_ART'
  | 'POSTER'
  | 'DIGITAL_MARKETING'
  | 'SOCIAL_MEDIA'
  | 'PR'
  | 'FESTIVALS'
  | 'SCREENINGS'
  | 'PRINT_ADS'
  | 'OOH'
  | 'TV_SPOTS'
  | 'RADIO'
  | 'PRESS_KIT'
  | 'PREMIERE'
  | 'OTHER';

export type PublicityStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface PublicityExpense {
  id: string;
  publicityBudgetId: string;
  description: string;
  amount: number;
  expenseDate: string;
  vendor?: string | null;
  invoiceNumber?: string | null;
  attachmentUrl?: string | null;
  notes?: string | null;
  createdAt: string;
  publicityBudget?: {
    name: string;
    category: string;
  };
}

export interface CampaignEvent {
  id: string;
  projectId: string;
  publicityBudgetId?: string | null;
  title: string;
  description?: string | null;
  eventType: CampaignEventType;
  startDate: string;
  endDate?: string | null;
  deliverable?: string | null;
  status: CampaignStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string;
  publicityBudget?: {
    id: string;
    name: string;
    category: string;
    budgetAmount: number;
  };
  project?: {
    id: string;
    title: string;
  };
}

export type CampaignEventType =
  | 'TEASER_RELEASE'
  | 'TRAILER_RELEASE'
  | 'POSTER_REVEAL'
  | 'FESTIVAL_SUBMISSION'
  | 'FESTIVAL_SCREENING'
  | 'PREMIERE'
  | 'THEATRICAL_RELEASE'
  | 'STREAMING_RELEASE'
  | 'PRESS_CONFERENCE'
  | 'SOCIAL_MEDIA_CAMPAIGN'
  | 'TV_APPEARANCE'
  | 'PRESS_JUNKET'
  | 'OTHER';

export type CampaignStatus = 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface PublicitySummary {
  summary: {
    totalBudget: number;
    totalActual: number;
    totalVariance: number;
    percentSpent: number;
    itemCount: number;
    upcomingEvents: number;
    completedEvents: number;
    inProgressEvents: number;
    totalEvents: number;
  };
  byCategory: Array<{
    category: string;
    budgeted: number;
    actual: number;
    variance: number;
    count: number;
  }>;
  byStatus: Array<{
    status: string;
    budgeted: number;
    actual: number;
    count: number;
  }>;
  recentExpenses: PublicityExpense[];
}
