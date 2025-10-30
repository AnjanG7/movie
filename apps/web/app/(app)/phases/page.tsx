// app/phases/page.tsx - Phases listing page

"use client";

import { useEffect } from "react";
import { useStore } from "../lib/store";
import { Layers, Plus, Film } from "lucide-react";

const phaseColors: Record<string, { bg: string; text: string; icon: string }> =
  {
    DEVELOPMENT: { bg: "bg-blue-100", text: "text-blue-700", icon: "📝" },
    PRODUCTION: { bg: "bg-green-100", text: "text-green-700", icon: "🎬" },
    POST: { bg: "bg-orange-100", text: "text-orange-700", icon: "✂️" },
    PUBLICITY: { bg: "bg-purple-100", text: "text-purple-700", icon: "📢" },
  };

export default function PhasesPage() {
  const { phases, projects, loading, fetchPhases, fetchProjects } = useStore();

  useEffect(() => {
    fetchPhases();
    fetchProjects();
  }, [fetchPhases, fetchProjects]);

  // Group phases by project
  const phasesByProject = phases.reduce(
    (acc, phase) => {
      const projectId = phase.projectId;
      if (!acc[projectId]) {
        acc[projectId] = [];
      }
      acc[projectId].push(phase);
      return acc;
    },
    {} as Record<string, typeof phases>
  );

  if (loading && phases.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Production Phases
          </h1>
          <p className="text-gray-600">Track phases across all projects</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-5 h-5" />
          Add Phase
        </button>
      </div>

      {/* Phase Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Object.entries(phaseColors).map(([phaseName, colors]) => {
          const count = phases.filter((p) => p.name === phaseName).length;
          return (
            <div
              key={phaseName}
              className="bg-white rounded-xl p-6 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">{colors.icon}</span>
                <span
                  className={`px-3 py-1 ${colors.bg} ${colors.text} rounded-full text-xs font-semibold`}
                >
                  {count} active
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {phaseName}
              </h3>
              <p className="text-sm text-gray-600">Phase projects</p>
            </div>
          );
        })}
      </div>

      {/* Phases by Project */}
      {Object.keys(phasesByProject).length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
          <Layers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No phases yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create phases to organize your project workflow
          </p>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-5 h-5" />
            Create First Phase
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(phasesByProject).map(([projectId, projectPhases]) => {
            const project = projects.find((p) => p.id === projectId);
            return (
              <div
                key={projectId}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                {/* Project Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Film className="w-5 h-5 text-gray-600" />
                    <h3 className="font-bold text-gray-900">
                      {project?.title || "Unknown Project"}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {projectPhases.length}{" "}
                      {projectPhases.length === 1 ? "phase" : "phases"}
                    </span>
                  </div>
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Manage Phases
                  </button>
                </div>

                {/* Phases List */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {projectPhases
                      .sort((a, b) => (a.orderNo || 0) - (b.orderNo || 0))
                      .map((phase) => {
                        const colors = phaseColors[phase.name] ?? {
                          bg: "bg-gray-100",
                          text: "text-gray-700",
                          icon: "❓",
                        };
                        return (
                          <div
                            key={phase.id}
                            className={`${colors.bg} rounded-lg p-4 border-2 border-transparent hover:border-blue-400 transition-all cursor-pointer`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-2xl">{colors.icon}</span>
                              {phase.orderNo && (
                                <span
                                  className={`${colors.text} text-xs font-semibold`}
                                >
                                  #{phase.orderNo}
                                </span>
                              )}
                            </div>
                            <h4 className={`font-bold ${colors.text} mb-1`}>
                              {phase.name}
                            </h4>
                            <p className={`text-xs ${colors.text} opacity-75`}>
                              Production phase
                            </p>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
