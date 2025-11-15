// lib/store.ts - Zustand global state management

import { create } from "zustand";
import { persist,  createJSONStorage } from "zustand/middleware";
import { Project, Participant, PhaseEntity, DashboardStats } from "./types";
import { projectsApi, investorsApi, phasesApi, userApi } from "./api";
// import { User, AuditLog, Role, UserRole } from "../../../../../packages/types";
import { User } from "./types";


interface AppState {
  // Data Types
  user: User | null;
  
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
  
  logout: () => void;
  fetchInvestors: () => Promise<void>;
  fetchPhases: () => Promise<void>;
  calculateStats: () => void;
  setError: (error: string | null) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      
      projects: [],
      investors: [],
      phases: [],
      stats: null,
      loading: false,
      error: null,

      // Set User
      setUser: (user) => set({ user }),
      
      logout: () => set({ user: null }),

      // Fetch projects
      fetchProjects: async () => {
        set({ loading: true, error: null });
        try {
          const response = await projectsApi.getAll();
          if (response.data.success && response.data.data) {
            set({ projects: response.data.data.projects || [], loading: false });
            get().calculateStats();
          } else {
            set({ error: 'Failed to fetch projects', loading: false });
          }
        } catch (error: any) {
          set({ error: error.message || 'Failed to fetch projects', loading: false });
        }
      },
      
      // Fetch investors
      fetchInvestors: async () => {
        set({ loading: true, error: null });
        try {
          const response = await investorsApi.getAll();
          // Backend route is commented out, so this will fail gracefully
          set({ investors: Array.isArray(response.data) ? response.data : [], loading: false });
        } catch (error: any) {
          // Silently fail since backend route is not implemented yet
          console.warn('Investors API not available:', error.message);
          set({ investors: [], loading: false });
        }
      },

      // Fetch phases
      fetchPhases: async () => {
        set({ loading: true, error: null });
        try {
          const response = await phasesApi.getAll();
          set({ phases: Array.isArray(response.data) ? response.data : [], loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      // Calculate dashboard stats
      calculateStats: () => {
        const { projects, investors, phases } = get();

        const totalProjects = projects.length;
        const activeProjects = projects.filter(
          (p) => p.status === "planning" || p.status === "active"
        ).length;
        const totalBudget = projects.reduce((sum, p) => {
          return (
            sum +
            (p.financingSources?.reduce((s, f) => s + f.amount, 0) || 0)
          );
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
    }),
    {
      name: "app-storage", // 👈 unique key in localStorage
      partialize: (state) => ({
        user: state.user,
      }), // 👈 only persist auth data
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }
      ),
    }
  )
);
