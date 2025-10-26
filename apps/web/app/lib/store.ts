// lib/store.ts - Zustand global state management

import { create } from 'zustand';
import { Project, Participant, PhaseEntity, DashboardStats } from './types';
import { projectsApi, investorsApi, phasesApi, userApi } from './api';
import { User,AuditLog, Role, UserRole } from '../../../../packages/types';


interface AppState {
  // Data Types
  user: User | null;
  token: string | null;
  projects: Project[];
  investors: Participant[]; 
  phases: PhaseEntity[];
  stats: DashboardStats | null;
  
  
  // Loading states
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchProjects: () => Promise<void>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout:() => void;
  fetchInvestors: () => Promise<void>;
  fetchPhases: () => Promise<void>;
  calculateStats: () => void;
  setError: (error: string | null) => void;

}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  user: null,
  token:null,
  projects: [],
  investors: [],
  phases: [],
  stats: null,
  loading: false,
  error: null,

  //Set User
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  logout: () => set({ user: null, token: null }),

  // Fetch projects
  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      const response = await projectsApi.getAll();
      set({ projects: response.data, loading: false });
      get().calculateStats();
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  // Fetch investors
  fetchInvestors: async () => {
    set({ loading: true, error: null });
    try {
      const response = await investorsApi.getAll();
      set({ investors: response.data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  // Fetch phases
  fetchPhases: async () => {
    set({ loading: true, error: null });
    try {
      const response = await phasesApi.getAll();
      set({ phases: response.data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  // Calculate dashboard stats
  calculateStats: () => {
    const { projects, investors, phases } = get();
    
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'planning' || p.status === 'active').length;
    const totalBudget = projects.reduce((sum, p) => {
      return sum + (p.financingSources?.reduce((s, f) => s + f.amount, 0) || 0);
    }, 0);
    
    const projectsByPhase = phases.reduce((acc, phase) => {
      acc[phase.name] = (acc[phase.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    set({
      stats: {
        totalProjects,
        activeProjects,
        totalBudget,
        totalInvestors: investors.length,
        projectsByPhase: projectsByPhase as any,
      },
    });
  },

  setError: (error) => set({ error }),
}));