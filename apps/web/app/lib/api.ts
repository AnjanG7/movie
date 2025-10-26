// lib/api.ts - API client for backend communication

import axios from 'axios';
import { Project, Participant, PhaseEntity } from './types';
import { User } from '../../../../packages/types';

const api = axios.create({
  baseURL: 'http://localhost:8800/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Projects API
export const userApi = {
  login: (data: Partial<User>) => api.post<User>('/auth/login', data),
  create: (data: Partial<User>) => api.post<User>('/auth/signup', data),
};

// Projects API
export const projectsApi = {
  getAll: () => api.get<Project[]>('/projects'),
  getById: (id: string) => api.get<Project>(`/projects/${id}`),
  create: (data: Partial<Project>) => api.post<Project>('/projects', data),
};

// Investors API
export const investorsApi = {
  getAll: () => api.get<Participant[]>('/investors'),
  getById: (id: string) => api.get<Participant>(`/investors/${id}`),
  create: (data: Partial<Participant>) => api.post<Participant>('/investors', data),
};

// Phases API
export const phasesApi = {
  getAll: () => api.get<PhaseEntity[]>('/phases'),
  getByProject: (projectId: string) => api.get<PhaseEntity[]>(`/phases/project/${projectId}`),
  create: (data: Partial<PhaseEntity>) => api.post<PhaseEntity>('/phases', data),
};

export default api;