// lib/api.ts - API client for backend communication

import axios from 'axios';
import { Project, Participant, PhaseEntity } from './types';
import { User } from '../../../../../packages/types';

const api = axios.create({
  baseURL: 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage (Zustand persist storage)
    const storedData = localStorage.getItem('film-finance-storage');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        const token = parsed.state?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Error parsing stored data:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear storage and redirect to login
      localStorage.removeItem('film-finance-storage');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

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