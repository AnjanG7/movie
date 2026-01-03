"use client";

import { useEffect, useState } from "react";
import { useStore } from "../lib/store";
import StatsCard from "../components/StatsCard";
import ProjectCard from "../components/ProjectCard";
import BudgetChart from "../components/charts/BudgetChart";
import DonutChart from "../components/charts/DonutChart";
import { Film, Users, DollarSign, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";

// Type for project summary item
type ProjectSummaryItem = {
  _count: { id: number };
  currentPhase: "DEVELOPMENT" | "PRODUCTION" | "POST" | "PUBLICITY";
};

export default function DashboardPage() {
  const {
    projects,
    investors,
    stats,
    loading,
    fetchProjects,
    fetchInvestors,
    fetchPhases,
  } = useStore();
  const { user } = useStore();

  const [userCount, setUserCount] = useState(0);
  const [projectSummary, setProjectSummary] = useState<ProjectSummaryItem[]>(
    []
  );

  // Fetch users count
  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        const res = await fetch(
          `https://film-finance-app.onrender.com/api/auth/allUsers`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }
        );
        if (!res.ok) throw new Error("Failed to fetch users");
        const result = await res.json();
        setUserCount(result?.data?.users?.length || 0);
      } catch (err) {
        console.error(err);
        setUserCount(0);
      }
    };
    fetchUserCount();
  }, []);

  // Fetch projects, investors, phases
  useEffect(() => {
    fetchProjects();
    fetchInvestors();
    fetchPhases();
  }, [fetchProjects, fetchInvestors, fetchPhases]);

  // Fetch project summary by phase
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch(
          "https://film-finance-app.onrender.com/api/projects/summary",
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }
        );
        if (!res.ok) throw new Error("Failed to fetch project summary");
        const result = await res.json();
        setProjectSummary(result.data || []);
      } catch (err) {
        console.error(err);
        setProjectSummary([]);
      }
    };
    fetchSummary();
  }, []);

  // Prepare chart data
  const budgetData = projects.slice(0, 5).map((p) => ({
    name: p.title.substring(0, 15),
    budget: p.financingSources?.reduce((sum, f) => sum + f.amount, 0) || 0,
    spent:
      (p.financingSources?.reduce((sum, f) => sum + f.amount, 0) || 0) * 0.6, // Mock spent
  }));

  const phaseSummaryData = projectSummary.map((item) => ({
    name: item.currentPhase,
    value: item._count.id,
    color:
      {
        DEVELOPMENT: "#3b82f6",
        PRODUCTION: "#10b981",
        POST: "#f59e0b",
        PUBLICITY: "#8b5cf6",
      }[item.currentPhase] || "#6b7280",
  }));

  if (loading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const fetchUser = async () => {
    try {
      const response = await fetch(
        `https://film-finance-app.onrender.com/api/auth/allUsers`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (!response.ok) throw new Error(`HTTP error ${response.status}`);

      const result = await response.json();

      return result?.data?.users?.length || 0;
    } catch (error) {
      console.error("Error fetching users:", error);
      return 0;
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Projects"
          value={stats?.totalProjects || 0}
          change={12}
          icon={Film}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
        />
        {user?.role?.toLowerCase() === "admin" && (
          <Link href="/all-users" className="block h-full">
            <StatsCard
              title="Total Users"
              value={userCount}
              change={2}
              icon={Users}
              iconColor="text-blue-600"
              iconBg="bg-blue-100"
            />
          </Link>
        )}
        <StatsCard
          title="Active Projects"
          value={stats?.activeProjects || 0}
          change={8}
          icon={TrendingUp}
          iconColor="text-green-600"
          iconBg="bg-green-100"
        />
        <StatsCard
          title="Total Budget"
          value={`${((stats?.totalBudget || 0) / 1000000).toFixed(1)}M`}
          change={15}
          icon={DollarSign}
          iconColor="text-purple-600"
          iconBg="bg-purple-100"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <BudgetChart data={budgetData} />
        </div>
        <div>
          <DonutChart data={phaseSummaryData} title="Projects by Phase" />
        </div>
      </div>

      {/* Recent Projects */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">Recent Projects</h3>
          <Link
            href="/projects"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-12">
            <Film className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No projects yet</p>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Film className="w-4 h-4" />
              Create First Project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.slice(0, 6).map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
