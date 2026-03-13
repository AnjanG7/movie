// lib/api.ts - API client for backend communication

import axios from "axios";
import { Project, Participant, PhaseEntity } from "./types";
// import { User } from '../../../../../packages/types';

const api = axios.create({
  baseURL: "http://localhost:4000/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important: to send and receive cookies
});

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear storage and redirect to login
      if (typeof window !== "undefined") {
        localStorage.removeItem("app-storage");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Projects API
export const projectsApi = {
  getAll: () =>
    api.get<{
      success: boolean;
      data: {
        projects: Project[];
        total: number;
        page: number;
        totalPages: number;
      };
    }>("/projects"),
  getById: (id: string) =>
    api.get<{ success: boolean; data: Project }>(`/projects/${id}`),
  create: (data: Partial<Project>) =>
    api.post<{ success: boolean; data: Project }>("/projects/create", data),
  assign: (data: { projectId: string; ownerId: string }) =>
    api.put<{ success: boolean; data: Project }>("/projects/assign", data),
};

// Budget API
export interface BudgetVersion {
  id: string;
  projectId: string;
  version: string;
  type: "BASELINE" | "WORKING" | "QUOTE";
  createdBy?: string;
  lockedAt?: string;
  createdAt: string;
  lines?: BudgetLineItem[];
}

export interface BudgetLineItem {
  id: string;
  budgetVersionId: string;
  phase: string;
  department?: string;
  name: string;
  qty: number;
  rate: number;
  taxPercent?: number;
  vendor?: string;
  notes?: string;
  createdAt: string;
}

export const budgetApi = {
  getVersions: (
    projectId: string,
    query?: { page?: number; limit?: number; type?: string; locked?: boolean }
  ) => {
    const params = new URLSearchParams();
    if (query?.page) params.append("page", query.page.toString());
    if (query?.limit) params.append("limit", query.limit.toString());
    if (query?.type) params.append("type", query.type);
    if (query?.locked !== undefined)
      params.append("locked", query.locked.toString());
    const queryString = params.toString();
    return api.get<{
      success: boolean;
      data: {
        versions: BudgetVersion[];
        total: number;
        page: number;
        totalPages: number;
      };
    }>(`/projects/${projectId}/budget${queryString ? `?${queryString}` : ""}`);
  },
  createVersion: (projectId: string, data: { version: string; type: string }) =>
    api.post<{ success: boolean; data: BudgetVersion }>(
      `/projects/${projectId}/budget`,
      data
    ),
  addLineItem: (
    projectId: string,
    versionId: string,
    data: Partial<BudgetLineItem>
  ) =>
    api.post<{ success: boolean; data: BudgetLineItem }>(
      `/projects/${projectId}/budget/${versionId}/lines`,
      data
    ),
  updateLineItem: (
    projectId: string,
    lineId: string,
    data: Partial<BudgetLineItem>
  ) =>
    api.put<{ success: boolean; data: BudgetLineItem }>(
      `/projects/${projectId}/budget/lines/${lineId}`,
      data
    ),
  deleteLineItem: (projectId: string, lineId: string) =>
    api.delete<{ success: boolean; data: { message: string } }>(
      `/projects/${projectId}/budget/lines/${lineId}`
    ),
  lockBaseline: (projectId: string, versionId: string) =>
    api.post<{ success: boolean; data: BudgetVersion }>(
      `/projects/${projectId}/budget/${versionId}/lock`
    ),
};

// Investors API - Note: Backend routes are commented out, so these will fail until backend is implemented
export const investorsApi = {
  getAll: () => api.get<Participant[]>("/investors"),
  getById: (id: string) => api.get<Participant>(`/investors/${id}`),
  create: (data: Partial<Participant>) =>
    api.post<Participant>("/investors", data),
};

// Phases API - Note: Backend routes are commented out, but we can get phases from projects
export const phasesApi = {
  getAll: () => {
    // Since phases endpoint is commented out, we'll get phases from projects
    return projectsApi.getAll().then((res) => {
      const allPhases: PhaseEntity[] = [];
      res.data.data.projects.forEach((project) => {
        if (project.phases) {
          allPhases.push(...project.phases);
        }
      });
      return { data: allPhases } as any;
    });
  },
  getByProject: (projectId: string) => {
    // Get phases from project data
    return projectsApi.getById(projectId).then(
      (res) =>
        ({
          data: res.data.data.phases || [],
        }) as any
    );
  },
  create: (data: Partial<PhaseEntity>) =>
    api.post<PhaseEntity>("/phases", data),
};

export default api;
