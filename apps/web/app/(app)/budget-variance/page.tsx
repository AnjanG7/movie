"use client";

import React, { useState, useEffect, ChangeEvent } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://film-finance-app.onrender.com/api";

interface Project {
  id: string;
  title: string;
  baseCurrency: string;
}

interface VarianceLine {
  id: string;
  name: string;
  phase: string;
  department: string | null;
  budgeted: number;
  committed: number;
  spent: number;
  variance: number;
  variancePercent: number;
}

interface PhaseData {
  budgeted: number;
  committed: number;
  spent: number;
  variance: number;
}

interface VarianceReport {
  summary: {
    totalBudgeted: number;
    totalCommitted: number;
    totalSpent: number;
    totalVariance: number;
    overBudgetLines: number;
    underBudgetLines: number;
  };
  byPhase: Record<string, PhaseData>;
  lines: VarianceLine[];
}

export default function BudgetVariancePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [report, setReport] = useState<VarianceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    console.log("🎯 Selected Project Changed:", selectedProjectId);
    
    if (selectedProjectId) {
      fetchVarianceReport();
    } else {
      setReport(null);
      setError(null);
    }
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects?limit=9999`, {
        credentials: "include",
      });
      const result = await response.json();
      if (result.success) {
        setProjects(result.data.projects || []);
        console.log("📋 Loaded projects:", result.data.projects?.length || 0);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchVarianceReport = async () => {
    if (!selectedProjectId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log("🔍 Fetching variance report for project:", selectedProjectId);
      
      const response = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/budget-lines/variance-report`,
        { credentials: "include" }
      );
      
      console.log("📡 Variance report response status:", response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch variance report: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log("📦 Variance report response:", result);
      
      if (result.success) {
        setReport(result.data as VarianceReport);
        console.log("✅ Loaded variance report");
        console.log("   Total Budgeted:", result.data.summary.totalBudgeted);
        console.log("   Total Spent:", result.data.summary.totalSpent);
        console.log("   Lines with variance:", result.data.lines.length);
      } else {
        throw new Error(result.message || "Failed to fetch variance report");
      }
    } catch (error: any) {
      console.error("❌ Error fetching variance report:", error);
      setError(error.message || "Failed to load variance report");
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newProjectId = e.target.value;
    console.log("🔄 Project dropdown changed - Old:", selectedProjectId, "New:", newProjectId);
    setSelectedProjectId(newProjectId);
  };

  const formatCurrency = (amount: number) => {
    const project = projects.find((p) => p.id === selectedProjectId);
    const currency = project?.baseCurrency || "USD";
    return `${currency} ${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getVarianceColorClass = (variance: number) => {
    if (variance < 0) return "text-red-600";
    if (variance > 0) return "text-emerald-600";
    return "text-slate-500";
  };

  const getVarianceBgClass = (variance: number) => {
    if (variance < 0) return "bg-red-50";
    if (variance > 0) return "bg-emerald-50";
    return "";
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
          <div>
            <p className="text-xs font-semibold tracking-widest text-blue-600 uppercase mb-1">
              Budget Control
            </p>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              Budget vs Actuals – Variance Report
            </h1>
            <p className="text-slate-600 mt-2 text-sm lg:text-base">
              See where your film is over or under budget by phase, department,
              and line item.
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">
                Project
              </span>
              <select
                value={selectedProjectId}
                onChange={handleProjectChange}
                className="h-10 min-w-[220px] rounded-lg border border-slate-300 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Project --</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>
            {selectedProject && (
              <div className="px-3 py-1 rounded-lg bg-white/70 border border-slate-200 text-xs text-slate-600 shadow-sm">
                Base currency:{" "}
                <span className="font-semibold">
                  {selectedProject.baseCurrency}
                </span>
              </div>
            )}
          </div>
        </div>

 

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl border border-red-200 bg-red-50">
            <p className="text-sm font-semibold text-red-700">
              ⚠ Error: {error}
            </p>
            <button
              onClick={fetchVarianceReport}
              className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Main content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-slate-600 mt-4">Loading variance report...</p>
          </div>
        ) : !selectedProjectId ? (
          <div className="mt-10 text-center p-10 bg-white/80 rounded-2xl border border-slate-200">
            <p className="text-base text-slate-700 mb-2">
              Select a project to view its variance report.
            </p>
            <p className="text-sm text-slate-500">
              You&apos;ll see totals, phase breakdowns, and lines with the
              biggest overages or savings.
            </p>
          </div>
        ) : !report ? (
          <div className="mt-10 text-center p-10 bg-white/80 rounded-2xl border border-slate-200">
            <p className="text-base text-slate-700 mb-2">
              No variance data available for this project.
            </p>
            <p className="text-sm text-slate-500">
              Make sure the project has a working budget with budget lines.
            </p>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
                <div className="text-xs text-slate-500 uppercase mb-1">
                  Total Budgeted
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {formatCurrency(report.summary.totalBudgeted)}
                </div>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-white shadow-sm p-4">
                <div className="text-xs text-slate-500 uppercase mb-1">
                  Total Committed
                </div>
                <div className="text-2xl font-bold text-amber-600">
                  {formatCurrency(report.summary.totalCommitted)}
                </div>
              </div>
              <div className="rounded-2xl border border-red-200 bg-white shadow-sm p-4">
                <div className="text-xs text-slate-500 uppercase mb-1">
                  Total Spent
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(report.summary.totalSpent)}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
                <div className="text-xs text-slate-500 uppercase mb-1">
                  Total Variance
                </div>
                <div
                  className={`text-2xl font-bold ${getVarianceColorClass(
                    report.summary.totalVariance
                  )}`}
                >
                  {formatCurrency(report.summary.totalVariance)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Positive = under budget, negative = over budget
                </div>
              </div>
            </div>

            {/* Alert */}
            {report.summary.overBudgetLines > 0 && (
              <div className="mb-6 p-4 rounded-2xl border border-red-200 bg-red-50">
                <p className="text-sm font-semibold text-red-700">
                  ⚠ {report.summary.overBudgetLines} budget line
                  {report.summary.overBudgetLines > 1 ? "s are" : " is"} over
                  budget. Review the significant variance table below.
                </p>
              </div>
            )}

            {/* By Phase Summary */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">
                Variance by Phase
              </h2>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Phase</th>
                      <th className="px-4 py-2 text-right">Budgeted</th>
                      <th className="px-4 py-2 text-right">Committed</th>
                      <th className="px-4 py-2 text-right">Spent</th>
                      <th className="px-4 py-2 text-right">Variance</th>
                      <th className="px-4 py-2 text-right">Variance %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(report.byPhase).map(([phase, data]) => {
                      const variancePercent =
                        data.budgeted > 0
                          ? (data.variance / data.budgeted) * 100
                          : 0;
                      const colorClass = getVarianceColorClass(data.variance);
                      return (
                        <tr
                          key={phase}
                          className="border-t border-slate-100 hover:bg-slate-50"
                        >
                          <td className="px-4 py-2 font-semibold">{phase}</td>
                          <td className="px-4 py-2 text-right">
                            {formatCurrency(data.budgeted)}
                          </td>
                          <td className="px-4 py-2 text-right text-amber-600">
                            {formatCurrency(data.committed)}
                          </td>
                          <td className="px-4 py-2 text-right text-red-600">
                            {formatCurrency(data.spent)}
                          </td>
                          <td
                            className={`px-4 py-2 text-right font-semibold ${colorClass}`}
                          >
                            {formatCurrency(data.variance)}
                          </td>
                          <td className={`px-4 py-2 text-right ${colorClass}`}>
                            {variancePercent.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Significant Variance Lines */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-slate-900">
                  Lines with Significant Variance (&gt; 10%)
                </h2>
                <span className="text-xs text-slate-500">
                  Over budget lines highlighted in red
                </span>
              </div>
              {report.lines.length === 0 ? (
                <div className="p-6 rounded-2xl bg-white/80 border border-slate-200 text-sm text-slate-600">
                  No significant variances detected. All lines are within 10% of
                  budget.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Phase</th>
                        <th className="px-4 py-2 text-left">Department</th>
                        <th className="px-4 py-2 text-left">Line Item</th>
                        <th className="px-4 py-2 text-right">Budgeted</th>
                        <th className="px-4 py-2 text-right">Committed</th>
                        <th className="px-4 py-2 text-right">Spent</th>
                        <th className="px-4 py-2 text-right">Variance</th>
                        <th className="px-4 py-2 text-right">Variance %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.lines.map((line) => (
                        <tr
                          key={line.id}
                          className={`border-t border-slate-100 hover:bg-slate-50 ${getVarianceBgClass(
                            line.variance
                          )}`}
                        >
                          <td className="px-4 py-2">{line.phase}</td>
                          <td className="px-4 py-2">
                            {line.department || "-"}
                          </td>
                          <td className="px-4 py-2">{line.name}</td>
                          <td className="px-4 py-2 text-right">
                            {formatCurrency(line.budgeted)}
                          </td>
                          <td className="px-4 py-2 text-right text-amber-600">
                            {formatCurrency(line.committed)}
                          </td>
                          <td className="px-4 py-2 text-right text-red-600">
                            {formatCurrency(line.spent)}
                          </td>
                          <td
                            className={`px-4 py-2 text-right font-semibold ${getVarianceColorClass(
                              line.variance
                            )}`}
                          >
                            {formatCurrency(line.variance)}
                          </td>
                          <td
                            className={`px-4 py-2 text-right ${getVarianceColorClass(
                              line.variance
                            )}`}
                          >
                            {line.variancePercent.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}