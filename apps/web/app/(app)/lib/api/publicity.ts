const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://film-finance-app.onrender.com/api";

// ==================== PUBLICITY BUDGET ====================

export const createPublicityBudget = async (projectId: string, data: any) => {
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/publicity/budgets`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    }
  );
  return response.json();
};

export const getPublicityBudgets = async (projectId: string, query?: any) => {
  const params = new URLSearchParams(query || {});
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/publicity/budgets?${params}`,
    {
      method: "GET",
      credentials: "include",
    }
  );
  return response.json();
};

export const getPublicityBudget = async (projectId: string, id: string) => {
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/publicity/budgets/${id}`,
    {
      method: "GET",
      credentials: "include",
    }
  );
  return response.json();
};

export const updatePublicityBudget = async (
  projectId: string,
  id: string,
  data: any
) => {
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/publicity/budgets/${id}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    }
  );
  return response.json();
};

export const deletePublicityBudget = async (projectId: string, id: string) => {
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/publicity/budgets/${id}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );
  return response.json();
};

// ==================== EXPENSES ====================

export const addPublicityExpense = async (
  projectId: string,
  budgetId: string,
  data: any
) => {
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/publicity/budgets/${budgetId}/expenses`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    }
  );
  return response.json();
};

export const getPublicityExpenses = async (
  projectId: string,
  budgetId: string
) => {
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/publicity/budgets/${budgetId}/expenses`,
    {
      method: "GET",
      credentials: "include",
    }
  );
  return response.json();
};

export const updatePublicityExpense = async (
  projectId: string,
  id: string,
  data: any
) => {
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/publicity/expenses/${id}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    }
  );
  return response.json();
};

export const deletePublicityExpense = async (projectId: string, id: string) => {
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/publicity/expenses/${id}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );
  return response.json();
};

// ==================== CAMPAIGN CALENDAR ====================

export const createCampaignEvent = async (projectId: string, data: any) => {
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/publicity/campaign`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    }
  );
  return response.json();
};

export const getCampaignCalendar = async (projectId: string, query?: any) => {
  const params = new URLSearchParams(query || {});
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/publicity/campaign?${params}`,
    {
      method: "GET",
      credentials: "include",
    }
  );
  return response.json();
};

export const getCampaignEvent = async (projectId: string, id: string) => {
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/publicity/campaign/${id}`,
    {
      method: "GET",
      credentials: "include",
    }
  );
  return response.json();
};

export const updateCampaignEvent = async (
  projectId: string,
  id: string,
  data: any
) => {
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/publicity/campaign/${id}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    }
  );
  return response.json();
};

export const deleteCampaignEvent = async (projectId: string, id: string) => {
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/publicity/campaign/${id}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );
  return response.json();
};

// ==================== REPORTS ====================

export const getPublicitySummary = async (projectId: string) => {
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/publicity/summary`,
    {
      method: "GET",
      credentials: "include",
    }
  );
  return response.json();
};

export const updateROIWithPublicity = async (projectId: string) => {
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/publicity/update-roi`,
    {
      method: "POST",
      credentials: "include",
    }
  );
  return response.json();
};
