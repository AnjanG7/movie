const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://movie-finance.onrender.com/api";

// ==================== QUOTATION ====================

export const createQuotation = async (projectId: string, data: any) => {
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/quotations`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    }
  );
  return response.json();
};

export const getQuotations = async (projectId: string) => {
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/quotations`,
    {
      method: "GET",
      credentials: "include",
    }
  );
  return response.json();
};

export const getQuotation = async (projectId: string, versionId: string) => {
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/quotations/${versionId}`,
    {
      method: "GET",
      credentials: "include",
    }
  );
  return response.json();
};

export const updateQuotation = async (
  projectId: string,
  versionId: string,
  data: any
) => {
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/quotations/${versionId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    }
  );
  return response.json();
};

export const deleteQuotation = async (projectId: string, versionId: string) => {
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/quotations/${versionId}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );
  return response.json();
};

// ==================== ROI CALCULATIONS ====================

export const calculateROI = async (
  projectId: string,
  versionId: string,
  data: any
) => {
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/quotations/${versionId}/calculate-roi`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    }
  );
  return response.json();
};

export const generateScenarios = async (
  projectId: string,
  versionId: string,
  data: any
) => {
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/quotations/${versionId}/scenarios`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    }
  );
  return response.json();
};

export const getMetrics = async (projectId: string, versionId: string) => {
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/quotations/${versionId}/metrics`,
    {
      method: "GET",
      credentials: "include",
    }
  );
  return response.json();
};

// ==================== BUDGET LINES ====================

export const addBudgetLine = async (
  projectId: string,
  versionId: string,
  data: any
) => {
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/quotations/${versionId}/lines`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    }
  );
  return response.json();
};

export const updateBudgetLine = async (
  projectId: string,
  lineId: string,
  data: any
) => {
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/quotations/lines/${lineId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    }
  );
  return response.json();
};

export const deleteBudgetLine = async (projectId: string, lineId: string) => {
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/quotations/lines/${lineId}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );
  return response.json();
};
