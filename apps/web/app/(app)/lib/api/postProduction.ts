const API_BASE_URL = "https://film-finance-app.onrender.com/api";

// ==================== POST TASKS ====================

export const createPostTask = async (projectId: string, data: any) => {
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/post-production/tasks`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    }
  );
  return response.json();
};

export const getPostTasks = async (projectId: string, params?: any) => {
  const queryString = params ? `?${new URLSearchParams(params)}` : "";
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/post-production/tasks${queryString}`,
    {
      method: "GET",
      credentials: "include",
    }
  );
  return response.json();
};

export const getPostTask = async (projectId: string, taskId: string) => {
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/post-production/tasks/${taskId}`,
    {
      method: "GET",
      credentials: "include",
    }
  );
  return response.json();
};

export const updatePostTask = async (
  projectId: string,
  taskId: string,
  data: any
) => {
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/post-production/tasks/${taskId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    }
  );
  return response.json();
};

export const deletePostTask = async (projectId: string, taskId: string) => {
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/post-production/tasks/${taskId}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );
  return response.json();
};

// ==================== POST BUDGET LINES ====================

export const getPostBudgetLines = async (projectId: string) => {
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/post-production/budget-lines`,
    {
      method: "GET",
      credentials: "include",
    }
  );
  return response.json();
};

export const addPostBudgetLine = async (projectId: string, data: any) => {
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/post-production/budget-lines`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    }
  );
  return response.json();
};

// ==================== FORECASTING ====================

export const getPostProductionForecast = async (projectId: string) => {
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/post-production/forecast`,
    {
      method: "GET",
      credentials: "include",
    }
  );
  return response.json();
};

export const updateROIWithPostProduction = async (projectId: string) => {
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/post-production/update-roi`,
    {
      method: "POST",
      credentials: "include",
    }
  );
  return response.json();
};
