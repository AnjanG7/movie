// app/budget/page.tsx - Budget management page

'use client';

import { useState, useEffect } from 'react';
import { 
  DollarSign, Plus, Filter, Download, TrendingUp, 
  TrendingDown, AlertCircle, Search, Edit, Trash2, Eye 
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { budgetApi, BudgetVersion, BudgetLineItem } from '../lib/api';
import { projectsApi } from '../lib/api';
import { Project } from '../lib/types';
import { useStore } from '../lib/store';

export default function BudgetPage() {
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [budgetVersions, setBudgetVersions] = useState<BudgetVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [budgetLines, setBudgetLines] = useState<BudgetLineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterPhase, setFilterPhase] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await projectsApi.getAll();
        if (response.data.success && response.data.data) {
          const projs = response.data.data.projects || [];
          setProjects(projs);
          if (projs.length > 0 && !selectedProjectId) {
            // setSelectedProjectId(projs[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };
    fetchProjects();
  }, []);

  // Fetch budget versions when project is selected
  useEffect(() => {
    if (!selectedProjectId) return;

    const fetchBudgetVersions = async () => {
      setLoading(true);
      try {
        const response = await budgetApi.getVersions(selectedProjectId, { limit: -1 });
        if (response.data.success && response.data.data) {
          const versions = response.data.data.versions || [];
          setBudgetVersions(versions);
          if (versions.length > 0 && !selectedVersionId) {
            // Prefer BASELINE, then WORKING, then first available
            const baseline = versions.find(v => v.type === 'BASELINE');
            const working = versions.find(v => v.type === 'WORKING');
            // setSelectedVersionId(baseline?.id || working?.id || versions[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching budget versions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBudgetVersions();
  }, [selectedProjectId]);

  // Fetch budget lines when version is selected
  useEffect(() => {
    if (!selectedVersionId) {
      setBudgetLines([]);
      return;
    }

    const version = budgetVersions.find(v => v.id === selectedVersionId);
    if (version && version.lines) {
      setBudgetLines(version.lines);
    } else {
      setBudgetLines([]);
    }
  }, [selectedVersionId, budgetVersions]);

  const currentVersion = budgetVersions.find(v => v.id === selectedVersionId);
  
  // Calculate totals from line items
  const totalBudget = budgetLines.reduce((sum, line) => sum + (line.qty * line.rate * (1 + (line.taxPercent || 0) / 100)), 0);
  // Note: Spent amount would come from actual spending data, for now we'll use 0 or calculate from other sources
  const totalSpent = 0; // This would need to come from actual spending/invoice data
  const utilizationRate = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Group lines by phase for breakdown
  const phaseBreakdown = budgetLines.reduce((acc, line) => {
    const phase = line.phase;
    if (!acc[phase]) {
      acc[phase] = { budget: 0, spent: 0 };
    }
    acc[phase].budget += line.qty * line.rate * (1 + (line.taxPercent || 0) / 100);
    return acc;
  }, {} as Record<string, { budget: number; spent: number }>);

  const phaseBreakdownData = Object.entries(phaseBreakdown).map(([phase, data]) => ({
    phase: phase.replace('_', ' '),
    budget: data.budget,
    spent: data.spent,
  }));

  // Budget trend data (would need historical data from backend)
  const budgetTrend = budgetVersions
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((v, idx) => {
      const versionTotal = v.lines?.reduce((sum, line) => sum + (line.qty * line.rate * (1 + (line.taxPercent || 0) / 100)), 0) || 0;
      return {
        month: `v${idx + 1}`,
        allocated: versionTotal,
        spent: versionTotal * 0.7, // Mock data - would come from actual spending
        forecast: versionTotal * 0.8,
      };
    });

  const filteredLines = budgetLines.filter(line => {
    const matchesPhase = filterPhase === 'all' || line.phase === filterPhase;
    const matchesSearch = line.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (line.department?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    return matchesPhase && matchesSearch;
  });

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Budget Management</h1>
          <p className="text-gray-600">Track and manage project budgets across all phases</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Project Selector */}
          {projects.length > 0 && (
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.title}</option>
              ))}
            </select>
          )}
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-5 h-5" />
            Export
          </button>
          {selectedProjectId && (
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-5 h-5" />
              New Budget Version
            </button>
          )}
        </div>
      </div>

      {!selectedProjectId ? (
        <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Project Selected</h3>
          <p className="text-gray-600">Please select a project to view budget information</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Version Selector */}
          {budgetVersions.length > 0 && (
            <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Budget Version</label>
              <select
                value={selectedVersionId}
                onChange={(e) => setSelectedVersionId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {budgetVersions.map(version => (
                  <option key={version.id} value={version.id}>
                    {version.version} - {version.type} {version.lockedAt ? '(Locked)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  {utilizationRate.toFixed(0)}%
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-1">Total Budget</p>
              <p className="text-2xl font-bold text-gray-900">
                ${totalBudget.toLocaleString()}
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">
                ${totalSpent.toLocaleString()}
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TrendingDown className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Remaining</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(totalBudget - totalSpent).toLocaleString()}
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Budget Versions</p>
              <p className="text-2xl font-bold text-gray-900">{budgetVersions.length}</p>
            </div>
          </div>

          {/* Charts Row */}
          {budgetTrend.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Budget Trend */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Budget Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={budgetTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="allocated" stroke="#3b82f6" strokeWidth={2} name="Allocated" />
                    <Line type="monotone" dataKey="spent" stroke="#10b981" strokeWidth={2} name="Spent" />
                    <Line type="monotone" dataKey="forecast" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" name="Forecast" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Phase Breakdown */}
              {phaseBreakdownData.length > 0 && (
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">Budget by Phase</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={phaseBreakdownData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="phase" tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="budget" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Budget" />
                      <Bar dataKey="spent" fill="#10b981" radius={[8, 8, 0, 0]} name="Spent" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Budget Lines Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Budget Line Items</h3>
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                {/* Phase Filter */}
                <select
                  value={filterPhase}
                  onChange={(e) => setFilterPhase(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">All Phases</option>
                  <option value="DEVELOPMENT">Development</option>
                  <option value="PRODUCTION">Production</option>
                  <option value="POST">Post</option>
                  <option value="PUBLICITY">Publicity</option>
                </select>
              </div>
            </div>

            {/* Table */}
            {filteredLines.length === 0 ? (
              <div className="p-12 text-center">
                <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Budget Line Items</h3>
                <p className="text-gray-600">Add line items to start tracking your budget</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Phase</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Department</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Item</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Qty</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Rate</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Budget</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Vendor</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredLines.map((line) => {
                      const budget = line.qty * line.rate * (1 + (line.taxPercent || 0) / 100);

                      return (
                        <tr key={line.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              line.phase === 'DEVELOPMENT' ? 'bg-blue-100 text-blue-700' :
                              line.phase === 'PRODUCTION' ? 'bg-green-100 text-green-700' :
                              line.phase === 'POST' ? 'bg-orange-100 text-orange-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>
                              {line.phase}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{line.department || '-'}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{line.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{line.qty}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${line.rate.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            ${budget.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{line.vendor || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                                <Eye className="w-4 h-4 text-gray-600" />
                              </button>
                              <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                                <Edit className="w-4 h-4 text-gray-600" />
                              </button>
                              <button className="p-1 hover:bg-red-50 rounded transition-colors">
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
