'use client';

export const dynamic = "force-dynamic";

import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { DollarSign, TrendingUp, Plus, Trash2, PiggyBank } from 'lucide-react';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface FinancingSource {
  id: string;
  projectId: string;
  type: string;
  amount: number;
  rate?: number;
  fees?: number;
  totalDrawn: number;
  remaining: number;
  createdAt: string;
}

interface Project {
  id: string;
  title: string;
  baseCurrency: string;
}

interface Drawdown {
  id: string;
  sourceId: string;
  date: string;
  amount: number;
  source?: {
    type: string;
  };
}

interface SourceFormData {
  type: string;
  amount: number;
  rate: number;
  fees: number;
}

interface DrawdownFormData {
  sourceId: string;
  date: string;
  amount: number;
}

export default function FinancingSourcesPage() {
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get('projectId');

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(
    projectIdParam || ''
  );
  const [sources, setSources] = useState<FinancingSource[]>([]);
  const [drawdowns, setDrawdowns] = useState<Drawdown[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [showDrawdownModal, setShowDrawdownModal] = useState(false);

  const [sourceFormData, setSourceFormData] = useState<SourceFormData>({
    type: 'EQUITY',
    amount: 0,
    rate: 0,
    fees: 0,
  });

  const [drawdownFormData, setDrawdownFormData] = useState<DrawdownFormData>({
    sourceId: '',
    date: new Date().toISOString().split('T')[0] as string,
    amount: 0,
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchFinancingSources();
      fetchDrawdowns();
    }
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects?limit=100`, {
        credentials: 'include',
      });
      const result = await response.json();
      if (result.success) {
        setProjects(result.data.projects || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchFinancingSources = async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/financing-sources`,
        { credentials: 'include' }
      );
      const result = await response.json();
      if (result.success) {
        setSources(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrawdowns = async () => {
    if (!selectedProjectId) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/drawdowns`,
        { credentials: 'include' }
      );
      const result = await response.json();
      if (result.success) {
        setDrawdowns(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching drawdowns:', error);
    }
  };

  const handleCreateSource = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProjectId) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/financing-sources`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(sourceFormData),
        }
      );

      const result = await response.json();
      if (result.success) {
        alert('Financing source created');
        setShowSourceModal(false);
        setSourceFormData({ type: 'EQUITY', amount: 0, rate: 0, fees: 0 });
        fetchFinancingSources();
      } else {
        alert(result.message || 'Failed to create source');
      }
    } catch (error) {
      console.error('Error creating source:', error);
      alert('Failed to create source');
    }
  };

  const handleCreateDrawdown = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProjectId) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/drawdowns`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(drawdownFormData),
        }
      );

      const result = await response.json();
      if (result.success) {
        alert('Drawdown created');
        setShowDrawdownModal(false);
        setDrawdownFormData({
          sourceId: '',
          date: new Date().toISOString().split('T')[0] as string,
          amount: 0,
        });
        fetchFinancingSources();
        fetchDrawdowns();
      } else {
        alert(result.message || 'Failed to create drawdown');
      }
    } catch (error) {
      console.error('Error creating drawdown:', error);
      alert('Failed to create drawdown');
    }
  };

  const handleDeleteSource = async (id: string) => {
    if (!confirm('Delete this financing source?')) return;
    if (!selectedProjectId) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/financing-sources/${id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      const result = await response.json();
      if (result.success) {
        alert('Source deleted');
        fetchFinancingSources();
      } else {
        alert(result.message || 'Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete');
    }
  };

  const handleDeleteDrawdown = async (id: string) => {
    if (!confirm('Delete this drawdown?')) return;
    if (!selectedProjectId) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/drawdowns/${id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      const result = await response.json();
      if (result.success) {
        alert('Drawdown deleted');
        fetchFinancingSources();
        fetchDrawdowns();
      } else {
        alert(result.message || 'Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete');
    }
  };

  const formatCurrency = (amount: number) => {
    const project = projects.find((p) => p.id === selectedProjectId);
    const currency = project?.baseCurrency || 'USD';
    return `${currency} ${amount.toLocaleString()}`;
  };

  const handleProjectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedProjectId(e.target.value);
  };

  const handleSourceFormChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'amount' || name === 'rate' || name === 'fees') {
      setSourceFormData((prev) => ({ ...prev, [name]: Number(value) }));
    } else {
      setSourceFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDrawdownFormChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'amount') {
      setDrawdownFormData((prev) => ({ ...prev, [name]: Number(value) }));
    } else {
      setDrawdownFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const totalFinancing = sources.reduce((sum, s) => sum + s.amount, 0);
  const totalDrawn = sources.reduce((sum, s) => sum + s.totalDrawn, 0);
  const totalRemaining = sources.reduce((sum, s) => sum + s.remaining, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <PiggyBank className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900">
                Financing Sources & Drawdowns
              </h1>
              <p className="text-slate-600 text-lg">
                Manage equity, loans, grants, and investor capital.
              </p>
            </div>
          </div>

          {selectedProject && (
            <div className="bg-white/70 border border-slate-200 rounded-xl px-4 py-3 shadow-sm text-sm text-slate-700">
              <div className="font-semibold">{selectedProject.title}</div>
              <div>Currency: {selectedProject.baseCurrency}</div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-md p-5 mb-8 flex flex-wrap gap-4 items-center">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-slate-700">
              Select Project
            </label>
            <select
              value={selectedProjectId}
              onChange={handleProjectChange}
              className="h-11 min-w-[220px] rounded-lg border border-slate-300 px-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">-- Select Project --</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>

          {selectedProjectId && (
            <>
              <button
                type="button"
                onClick={() => setShowSourceModal(true)}
                className="ml-auto inline-flex items-center gap-2 px-4 h-11 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Financing Source
              </button>
              <button
                type="button"
                onClick={() => setShowDrawdownModal(true)}
                className="inline-flex items-center gap-2 px-4 h-11 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm"
              >
                <TrendingUp className="w-4 h-4" />
                Record Drawdown
              </button>
            </>
          )}
        </div>

        {/* Summary Cards */}
        {selectedProjectId && sources.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
              <div className="text-xs text-slate-500 mb-1">
                Total Financing
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {formatCurrency(totalFinancing)}
              </div>
            </div>
            <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
              <div className="text-xs text-slate-500 mb-1">Total Drawn</div>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(totalDrawn)}
              </div>
            </div>
            <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
              <div className="text-xs text-slate-500 mb-1">
                Total Remaining
              </div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalRemaining)}
              </div>
            </div>
          </div>
        )}

        {/* Source Modal */}
        {showSourceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <h2 className="text-xl font-bold mb-4">Add Financing Source</h2>
              <form onSubmit={handleCreateSource} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Type
                  </label>
                  <select
                    name="type"
                    value={sourceFormData.type}
                    onChange={handleSourceFormChange}
                    className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="EQUITY">Equity Investment</option>
                    <option value="LOAN">Loan</option>
                    <option value="GRANT">Grant</option>
                    <option value="INCENTIVE">Tax Incentive</option>
                    <option value="MG">Minimum Guarantee</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Total Amount
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={sourceFormData.amount}
                    onChange={handleSourceFormChange}
                    min={0}
                    step="0.01"
                    required
                    className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Interest Rate (%) - Optional
                  </label>
                  <input
                    type="number"
                    name="rate"
                    value={sourceFormData.rate}
                    onChange={handleSourceFormChange}
                    min={0}
                    step="0.01"
                    className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Fees (%) - Optional
                  </label>
                  <input
                    type="number"
                    name="fees"
                    value={sourceFormData.fees}
                    onChange={handleSourceFormChange}
                    min={0}
                    step="0.01"
                    className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSourceModal(false)}
                    className="px-4 h-9 rounded-lg border border-slate-300 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 h-9 rounded-lg bg-green-600 text-white text-sm font-semibold"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Drawdown Modal */}
        {showDrawdownModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <h2 className="text-xl font-bold mb-4">Record Drawdown</h2>
              <form onSubmit={handleCreateDrawdown} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Financing Source
                  </label>
                  <select
                    name="sourceId"
                    value={drawdownFormData.sourceId}
                    onChange={handleDrawdownFormChange}
                    className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">-- Select Source --</option>
                    {sources.map((source) => (
                      <option key={source.id} value={source.id}>
                        {source.type} - {formatCurrency(source.amount)} (Available:{' '}
                        {formatCurrency(source.remaining)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Drawdown Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={drawdownFormData.date}
                    onChange={handleDrawdownFormChange}
                    required
                    className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={drawdownFormData.amount}
                    onChange={handleDrawdownFormChange}
                    min={0}
                    step="0.01"
                    required
                    className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDrawdownModal(false)}
                    className="px-4 h-9 rounded-lg border border-slate-300 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 h-9 rounded-lg bg-blue-600 text-white text-sm font-semibold"
                  >
                    Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tables */}
        {selectedProjectId && (
          <>
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">
                Financing Sources
              </h2>
              {loading ? (
                <p className="text-center text-slate-600">Loading...</p>
              ) : sources.length === 0 ? (
                <div className="text-center p-10 bg-white/80 rounded-2xl border border-slate-200">
                  <p className="text-base text-slate-700">
                    No financing sources yet. Add one to get started.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Type</th>
                        <th className="px-4 py-2 text-right">Total Amount</th>
                        <th className="px-4 py-2 text-right">Drawn</th>
                        <th className="px-4 py-2 text-right">Remaining</th>
                        <th className="px-4 py-2 text-left">Rate</th>
                        <th className="px-4 py-2 text-left">Fees</th>
                        <th className="px-4 py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sources.map((source) => (
                        <tr key={source.id} className="border-t hover:bg-slate-50">
                          <td className="px-4 py-2 font-semibold">{source.type}</td>
                          <td className="px-4 py-2 text-right">
                            {formatCurrency(source.amount)}
                          </td>
                          <td className="px-4 py-2 text-right text-red-600">
                            {formatCurrency(source.totalDrawn)}
                          </td>
                          <td className="px-4 py-2 text-right text-green-600">
                            {formatCurrency(source.remaining)}
                          </td>
                          <td className="px-4 py-2">
                            {source.rate ? `${source.rate}%` : '-'}
                          </td>
                          <td className="px-4 py-2">
                            {source.fees ? `${source.fees}%` : '-'}
                          </td>
                          <td className="px-4 py-2">
                            <button
                              type="button"
                              onClick={() => handleDeleteSource(source.id)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">
                Drawdown History
              </h2>
              {drawdowns.length === 0 ? (
                <div className="text-center p-10 bg-white/80 rounded-2xl border border-slate-200">
                  <p className="text-base text-slate-700">
                    No drawdowns recorded yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">Source Type</th>
                        <th className="px-4 py-2 text-right">Amount</th>
                        <th className="px-4 py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {drawdowns.map((drawdown) => (
                        <tr key={drawdown.id} className="border-t hover:bg-slate-50">
                          <td className="px-4 py-2">
                            {new Date(drawdown.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2">
                            {drawdown.source?.type || '-'}
                          </td>
                          <td className="px-4 py-2 text-right text-green-600 font-semibold">
                            {formatCurrency(drawdown.amount)}
                          </td>
                          <td className="px-4 py-2">
                            <button
                              type="button"
                              onClick={() => handleDeleteDrawdown(drawdown.id)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
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
