const APIBASEURL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://film-finance-app.onrender.com/api";

// Waterfall Types
export interface WaterfallTier {
  id?: string;
  waterfallId?: string;
  tierOrder: number;
  pctSplit: number;
  cap?: number;
  description: string;
}

export interface WaterfallParticipant {
  id?: string;
  waterfallId?: string;
  name: string;
  role: string; // "INVESTOR" | "PRODUCER" | "DISTRIBUTOR"
  pctShare: number;
  investmentAmount?: number;
  preferredReturn?: number;
  capAmount?: number;
  type?: string; // "EQUITY" | "DEBT" | "PROFIT_PARTICIPATION"
  orderNo?: number;
  financingSourceId?: string;
  recoupedAmount?: number;
}

export interface WaterfallPeriod {
  id?: string;
  waterfallId?: string;
  periodStart: string;
  periodEnd: string;
  netRevenue: number;
}

export interface WaterfallPayout {
  id: string;
  participantId: string;
  periodStart: string;
  periodEnd: string;
  amount: number;
  participant?: WaterfallParticipant;
}

export interface WaterfallDefinition {
  id: string;
  projectId: string;
  tiers?: WaterfallTier[];
  participants?: WaterfallParticipant[];
  periods?: WaterfallPeriod[];
  createdAt?: string;
}

// Create a new waterfall
export const createWaterfall = async (projectId: string) => {
  const response = await fetch(
    `${APIBASEURL}/projects/${projectId}/waterfalls`,
    {
      method: "POST",
      credentials: "include",
    }
  );
  return response.json();
};

// Add tiers to waterfall
export const addTiers = async (
  projectId: string,
  waterfallId: string,
  tiers: Omit<WaterfallTier, "id" | "waterfallId">[]
) => {
  const response = await fetch(
    `${APIBASEURL}/projects/${projectId}/waterfalls/${waterfallId}/tiers`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ tiers }),
    }
  );
  return response.json();
};

// Add participants to waterfall
export const addParticipants = async (
  projectId: string,
  waterfallId: string,
  participants: Omit<WaterfallParticipant, "id" | "waterfallId">[]
) => {
  const response = await fetch(
    `${APIBASEURL}/projects/${projectId}/waterfalls/${waterfallId}/participants`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ participants }),
    }
  );
  return response.json();
};

// Add revenue period
export const addRevenuePeriod = async (
  projectId: string,
  waterfallId: string,
  period: Omit<WaterfallPeriod, "id" | "waterfallId">
) => {
  const response = await fetch(
    `${APIBASEURL}/projects/${projectId}/waterfalls/${waterfallId}/periods`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(period),
    }
  );
  return response.json();
};

// Calculate distribution
export const calculateDistribution = async (
  projectId: string,
  waterfallId: string
) => {
  const response = await fetch(
    `${APIBASEURL}/projects/${projectId}/waterfalls/${waterfallId}/distribution`,
    {
      headers: { "Content-Type": "application/json" },
      method: "POST",
      credentials: "include",
    }
  );
  return response.json();
};

export const getPayouts = async (projectId: string, waterfallId: string) => {
  const response = await fetch(
    `${APIBASEURL}/projects/${projectId}/waterfalls/${waterfallId}/payouts`,
    {
      method: "GET",
      credentials: "include",
    }
  );
  return response.json();
};

// Get waterfall (you may need to add this route to backend)
export const getWaterfall = async (projectId: string) => {
  const response = await fetch(
    `${APIBASEURL}/projects/${projectId}/waterfalls`,
    {
      method: "GET",
      credentials: "include",
    }
  );
  return response.json();
};
