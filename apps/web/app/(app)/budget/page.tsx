// app/budget/page.tsx - Budget management page

'use client';

import { useState, useEffect } from 'react';
import { 
  DollarSign, Plus, Filter, Download, TrendingUp, 
  TrendingDown, AlertCircle, Search, Edit, Trash2, Eye, X, Lock
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const API_BASE_URL = 'http://localhost:4000/api';

// Types
interface Project {
  id: string;
  title: string;
  baseCurrency: string;
  status: string;
}

interface BudgetVersion {
  id: string;
  projectId: string;
  version: number;
  type: 'BASELINE' | 'WORKING' | 'QUOTE';
  lockedAt: string | null;
  createdAt: string;
  lines?: BudgetLineItem[];
}

interface BudgetLineItem {
  id: string;
  budgetVersionId: string;
  name: string;
  phase: 'DEVELOPMENT' | 'PRODUCTION' | 'POST' | 'PUBLICITY';
  department: string | null;
  qty: number;
  rate: number;
  taxPercent: number | null;
  vendor: string | null;
}

interface CreateVersionForm {
  version: number;
  type: 'BASELINE' | 'WORKING' | 'QUOTE';
}

interface CreateLineItemForm {
  name: string;
  phase: 'DEVELOPMENT' | 'PRODUCTION' | 'POST' | 'PUBLICITY';
  department: string;
  qty: number;
  rate: number;
  taxPercent: number;
  vendor: string;
}

export default function BudgetPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [budgetVersions, setBudgetVersions] = useState<BudgetVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [budgetLines, setBudgetLines] = useState<BudgetLineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterPhase, setFilterPhase] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showCreateVersionModal, setShowCreateVersionModal] = useState(false);
  const [showCreateLineModal, setShowCreateLineModal] = useState(false);
  const [showEditLineModal, setShowEditLineModal] = useState(false);
  const [editingLine, setEditingLine] = useState<BudgetLineItem | null>(null);
  
  // Form states
  const [versionForm, setVersionForm] = useState<CreateVersionForm>({
    version: 1,
    type: 'WORKING'
  });
  
  const [lineForm, setLineForm] = useState<CreateLineItemForm>({
    name: '',
    phase: 'PRODUCTION',
    department: '',
    qty: 1,
    rate: 0,
    taxPercent: 0,
    vendor: ''
  });

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch budget versions when project is selected
  useEffect(() => {
    if (!selectedProjectId) return;
    fetchBudgetVersions();
  }, [selectedProjectId]);

  // Update budget lines when version is selected
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

  // API Calls
  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch projects');

      const result = await response.json();
      if (result.success && result.data) {
        const projs = result.data.projects || [];
        setProjects(projs);
        if (projs.length > 0 && !selectedProjectId) {
          setSelectedProjectId(projs[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchBudgetVersions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${selectedProjectId}/budget?limit=-1`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch budget versions');

      const result = await response.json();
      if (result.success && result.data) {
        const versions = result.data.versions || [];
        setBudgetVersions(versions);
        if (versions.length > 0 && !selectedVersionId) {
          const baseline = versions.find((v: BudgetVersion) => v.type === 'BASELINE');
          const working = versions.find((v: BudgetVersion) => v.type === 'WORKING');
          setSelectedVersionId(baseline?.id || working?.id || versions[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching budget versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBudgetVersion = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${selectedProjectId}/budget`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(versionForm),
      });

      if (!response.ok) throw new Error('Failed to create budget version');

      const result = await response.json();
      if (result.success && result.data) {
        await fetchBudgetVersions();
        setShowCreateVersionModal(false);
        setVersionForm({ version: 1, type: 'WORKING' });
      }
    } catch (error) {
      console.error('Error creating budget version:', error);
      alert('Failed to create budget version');
    }
  };

  const addLineItem = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${selectedProjectId}/budget/${selectedVersionId}/lines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(lineForm),
      });

      if (!response.ok) throw new Error('Failed to add line item');

      const result = await response.json();
      if (result.success) {
        await fetchBudgetVersions();
        setShowCreateLineModal(false);
        setLineForm({
          name: '',
          phase: 'PRODUCTION',
          department: '',
          qty: 1,
          rate: 0,
          taxPercent: 0,
          vendor: ''
        });
      }
    } catch (error) {
      console.error('Error adding line item:', error);
      alert('Failed to add line item');
    }
  };

  const updateLineItem = async () => {
    if (!editingLine) return;

    try {
      const response = await fetch(`${API_BASE_URL}/projects/${selectedProjectId}/budget/lines/${editingLine.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(lineForm),
      });

      if (!response.ok) throw new Error('Failed to update line item');

      const result = await response.json();
      if (result.success) {
        await fetchBudgetVersions();
        setShowEditLineModal(false);
        setEditingLine(null);
        setLineForm({
          name: '',
          phase: 'PRODUCTION',
          department: '',
          qty: 1,
          rate: 0,
          taxPercent: 0,
          vendor: ''
        });
      }
    } catch (error) {
      console.error('Error updating line item:', error);
      alert('Failed to update line item');
    }
  };

  const deleteLineItem = async (lineId: string) => {
    if (!confirm('Are you sure you want to delete this line item?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/projects/${selectedProjectId}/budget/lines/${lineId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete line item');

      const result = await response.json();
      if (result.success) {
        await fetchBudgetVersions();
      }
    } catch (error) {
      console.error('Error deleting line item:', error);
      alert('Failed to delete line item');
    }
  };

  const lockBaseline = async (versionId: string) => {
    if (!confirm('Are you sure you want to lock this baseline? This action cannot be undone.')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/projects/${selectedProjectId}/budget/${versionId}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to lock baseline');

      const result = await response.json();
      if (result.success) {
        await fetchBudgetVersions();
      }
    } catch (error) {
      console.error('Error locking baseline:', error);
      alert('Failed to lock baseline');
    }
  };

  // Helper functions
  const openEditModal = (line: BudgetLineItem) => {
    setEditingLine(line);
    setLineForm({
      name: line.name,
      phase: line.phase,
      department: line.department || '',
      qty: line.qty,
      rate: line.rate,
      taxPercent: line.taxPercent || 0,
      vendor: line.vendor || ''
    });
    setShowEditLineModal(true);
  };

  const currentVersion = budgetVersions.find(v => v.id === selectedVersionId);
  
  // Calculate totals from line items
  const totalBudget = budgetLines.reduce((sum, line) => sum + (line.qty * line.rate * (1 + (line.taxPercent || 0) / 100)), 0);
  const totalSpent = 0;
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

  // Budget trend data
  const budgetTrend = budgetVersions
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((v, idx) => {
      const versionTotal = v.lines?.reduce((sum, line) => sum + (line.qty * line.rate * (1 + (line.taxPercent || 0) / 100)), 0) || 0;
      return {
        month: `v${v.version}`,
        allocated: versionTotal,
        spent: versionTotal * 0.7,
        forecast: versionTotal * 0.8,
      };
    });

  const filteredLines = budgetLines.filter(line => {
    const matchesPhase = filterPhase === 'all' || line.phase === filterPhase;
    const matchesSearch = line.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (line.department?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    return matchesPhase && matchesSearch;
  });

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
            <button 
              onClick={() => setShowCreateVersionModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
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
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Budget Version</label>
                  <select
                    value={selectedVersionId}
                    onChange={(e) => setSelectedVersionId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {budgetVersions.map(version => (
                      <option key={version.id} value={version.id}>
                        v{version.version} - {version.type} {version.lockedAt ? '(Locked)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                {currentVersion && currentVersion.type === 'BASELINE' && !currentVersion.lockedAt && (
                  <button
                    onClick={() => lockBaseline(currentVersion.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors mt-6"
                  >
                    <Lock className="w-5 h-5" />
                    Lock Baseline
                  </button>
                )}
              </div>
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
                {selectedVersionId && (
                  <button
                    onClick={() => setShowCreateLineModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Line Item
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            {filteredLines.length === 0 ? (
              <div className="p-12 text-center">
                <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Budget Line Items</h3>
                <p className="text-gray-600 mb-4">Add line items to start tracking your budget</p>
                {selectedVersionId && (
                  <button
                    onClick={() => setShowCreateLineModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Add First Line Item
                  </button>
                )}
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
                              <button 
                                onClick={() => openEditModal(line)}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                              >
                                <Edit className="w-4 h-4 text-gray-600" />
                              </button>
                              <button 
                                onClick={() => deleteLineItem(line.id)}
                                className="p-1 hover:bg-red-50 rounded transition-colors"
                              >
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

      {/* Create Budget Version Modal */}
      {showCreateVersionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create Budget Version</h2>
              <button
                onClick={() => setShowCreateVersionModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); createBudgetVersion(); }}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Version Number *</label>
                <input
                  type="number"
                  min="1"
                  value={versionForm.version}
                  onChange={(e) => setVersionForm({ ...versionForm, version: parseInt(e.target.value) })}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                <select
                  value={versionForm.type}
                  onChange={(e) => setVersionForm({ ...versionForm, type: e.target.value as any })}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="BASELINE">BASELINE</option>
                  <option value="WORKING">WORKING</option>
                  <option value="QUOTE">QUOTE</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateVersionModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Version
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Line Item Modal */}
      {showCreateLineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add Line Item</h2>
              <button
                onClick={() => setShowCreateLineModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); addLineItem(); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Item Name *</label>
                  <input
                    type="text"
                    value={lineForm.name}
                    onChange={(e) => setLineForm({ ...lineForm, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Camera Operator"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phase *</label>
                  <select
                    value={lineForm.phase}
                    onChange={(e) => setLineForm({ ...lineForm, phase: e.target.value as any })}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="DEVELOPMENT">DEVELOPMENT</option>
                    <option value="PRODUCTION">PRODUCTION</option>
                    <option value="POST">POST</option>
                    <option value="PUBLICITY">PUBLICITY</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <input
                    type="text"
                    value={lineForm.department}
                    onChange={(e) => setLineForm({ ...lineForm, department: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Camera"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={lineForm.qty}
                    onChange={(e) => setLineForm({ ...lineForm, qty: parseFloat(e.target.value) })}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rate *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={lineForm.rate}
                    onChange={(e) => setLineForm({ ...lineForm, rate: parseFloat(e.target.value) })}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tax %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={lineForm.taxPercent}
                    onChange={(e) => setLineForm({ ...lineForm, taxPercent: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vendor</label>
                  <input
                    type="text"
                    value={lineForm.vendor}
                    onChange={(e) => setLineForm({ ...lineForm, vendor: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., ABC Equipment Rentals"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateLineModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Line Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Line Item Modal */}
      {showEditLineModal && editingLine && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Edit Line Item</h2>
              <button
                onClick={() => {
                  setShowEditLineModal(false);
                  setEditingLine(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); updateLineItem(); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Item Name *</label>
                  <input
                    type="text"
                    value={lineForm.name}
                    onChange={(e) => setLineForm({ ...lineForm, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phase *</label>
                  <select
                    value={lineForm.phase}
                    onChange={(e) => setLineForm({ ...lineForm, phase: e.target.value as any })}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="DEVELOPMENT">DEVELOPMENT</option>
                    <option value="PRODUCTION">PRODUCTION</option>
                    <option value="POST">POST</option>
                    <option value="PUBLICITY">PUBLICITY</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <input
                    type="text"
                    value={lineForm.department}
                    onChange={(e) => setLineForm({ ...lineForm, department: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={lineForm.qty}
                    onChange={(e) => setLineForm({ ...lineForm, qty: parseFloat(e.target.value) })}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rate *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={lineForm.rate}
                    onChange={(e) => setLineForm({ ...lineForm, rate: parseFloat(e.target.value) })}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tax %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={lineForm.taxPercent}
                    onChange={(e) => setLineForm({ ...lineForm, taxPercent: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vendor</label>
                  <input
                    type="text"
                    value={lineForm.vendor}
                    onChange={(e) => setLineForm({ ...lineForm, vendor: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditLineModal(false);
                    setEditingLine(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update Line Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}