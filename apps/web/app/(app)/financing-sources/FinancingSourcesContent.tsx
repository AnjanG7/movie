'use client';

import React, {
  useState,
  useEffect,
  FormEvent,
  ChangeEvent,
} from 'react';
import { useSearchParams } from 'next/navigation';
import { DollarSign, TrendingUp, Plus, Trash2, PiggyBank } from 'lucide-react';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

interface FinancingSource {
  id: string;
  projectId: string;
  type: string;
  amount: number;
  rate?: number | null;
  fees?: number | null;
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
  amount: number | string;
  rate?: number | string;
  fees?: number | string;
}

interface DrawdownFormData {
  sourceId: string;
  date: string;
  amount: number | string;
}

export default function FinancingSourcesContent() {
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get('projectId');

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    projectIdParam,
  );

  const [sources, setSources] = useState<FinancingSource[]>([]);
  const [drawdowns, setDrawdowns] = useState<Drawdown[]>([]);
  const [loading, setLoading] = useState(false);

  const [showSourceModal, setShowSourceModal] = useState(false);
  const [showDrawdownModal, setShowDrawdownModal] = useState(false);

  const [sourceFormData, setSourceFormData] = useState<SourceFormData>({
    type: 'EQUITY',
    amount: 0,
    rate: undefined,
    fees: undefined,
  });

  const [drawdownFormData, setDrawdownFormData] = useState<DrawdownFormData>({
    sourceId: '',
date: new Date().toISOString().split('T')[0] ?? "",

    amount: 0,
  });

  // ---------- Helpers ----------

  const selectedProject = projects.find(
    (p) => p.id === selectedProjectId,
  );

  const formatCurrency = (amount: number) => {
    const currency = selectedProject?.baseCurrency ?? 'USD';
    return `${currency} ${amount.toLocaleString()}`;
  };

  const handleProjectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedProjectId(e.target.value || null);
  };

  const handleSourceFormChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setSourceFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDrawdownFormChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setDrawdownFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ---------- Data fetching ----------

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/projects?limit=100`, {
          credentials: 'include',
        });
        const json = await res.json();
        if (json.success) setProjects(json.data.projects);
      } catch (err) {
        console.error('Error fetching projects', err);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    fetchFinancingSources();
    fetchDrawdowns();
  }, [selectedProjectId]);

  const fetchFinancingSources = async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/financing-sources`,
        { credentials: 'include' },
      );
      const json = await res.json();
      if (json.success) setSources(json.data);
    } catch (err) {
      console.error('Error fetching sources', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrawdowns = async () => {
    if (!selectedProjectId) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/drawdowns`,
        { credentials: 'include' },
      );
      const json = await res.json();
      if (json.success) setDrawdowns(json.data);
    } catch (err) {
      console.error('Error fetching drawdowns', err);
    }
  };

  // ---------- Create / delete ----------

  const handleCreateSource = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProjectId) return;

    const payload: any = {
      type: sourceFormData.type,
      amount: parseFloat(String(sourceFormData.amount)) || 0,
    };

    const rateNum = parseFloat(String(sourceFormData.rate));
    if (!Number.isNaN(rateNum) && String(sourceFormData.rate ?? '').trim() !== '') {
      payload.rate = rateNum;
    }

    const feesNum = parseFloat(String(sourceFormData.fees));
    if (!Number.isNaN(feesNum) && String(sourceFormData.fees ?? '').trim() !== '') {
      payload.fees = feesNum;
    }

    // Note: no schedule key; avoids sending `null` to Prisma [file:4].

    try {
      const res = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/financing-sources`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        },
      );
      const json = await res.json();
      if (json.success) {
        alert('Financing source created');
        setShowSourceModal(false);
        setSourceFormData({
          type: 'EQUITY',
          amount: 0,
          rate: undefined,
          fees: undefined,
        });
        fetchFinancingSources();
      } else {
        alert(json.message || 'Failed to create source');
      }
    } catch (err) {
      console.error('Error creating source', err);
      alert('Failed to create source');
    }
  };

  const handleCreateDrawdown = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProjectId) return;

    const payload = {
      sourceId: drawdownFormData.sourceId,
      date: drawdownFormData.date,
      amount: parseFloat(String(drawdownFormData.amount)) || 0,
    };

    try {
      const res = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/drawdowns`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        },
      );
      const json = await res.json();
      if (json.success) {
        alert('Drawdown created');
        setShowDrawdownModal(false);
        setDrawdownFormData({
          sourceId: '',
        date: new Date().toISOString().split('T')[0] ?? "",
          amount: 0,
        });
        fetchFinancingSources();
        fetchDrawdowns();
      } else {
        alert(json.message || 'Failed to create drawdown');
      }
    } catch (err) {
      console.error('Error creating drawdown', err);
      alert('Failed to create drawdown');
    }
  };

  const handleDeleteSource = async (id: string) => {
    if (!selectedProjectId || !confirm('Delete this financing source?')) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/financing-sources/${id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        },
      );
      const json = await res.json();
      if (json.success) {
        alert('Source deleted');
        fetchFinancingSources();
      } else {
        alert(json.message || 'Failed to delete');
      }
    } catch (err) {
      console.error('Error deleting source', err);
      alert('Failed to delete');
    }
  };

  const handleDeleteDrawdown = async (id: string) => {
    if (!selectedProjectId || !confirm('Delete this drawdown?')) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/drawdowns/${id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        },
      );
      const json = await res.json();
      if (json.success) {
        alert('Drawdown deleted');
        fetchFinancingSources();
        fetchDrawdowns();
      } else {
        alert(json.message || 'Failed to delete');
      }
    } catch (err) {
      console.error('Error deleting drawdown', err);
      alert('Failed to delete');
    }
  };

  // ---------- Derived totals ----------

  const totalFinancing = sources.reduce((sum, s) => sum + s.amount, 0);
  const totalDrawn = sources.reduce((sum, s) => sum + s.totalDrawn, 0);
  const totalRemaining = sources.reduce(
    (sum, s) => sum + s.remaining,
    0,
  );

  // ---------- Render ----------

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
                Financing Sources &amp; Drawdowns
              </h1>
              <p className="text-slate-600 text-lg">
                Manage equity, loans, grants, and investor capital.
              </p>
            </div>
          </div>

          {selectedProject && (
            <div className="bg-white/70 border border-slate-200 rounded-xl px-4 py-3 shadow-sm text-sm text-slate-700">
              <div className="font-semibold">{selectedProject.title}</div>
              <div>Currency {selectedProject.baseCurrency}</div>
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
              value={selectedProjectId ?? ''}
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

        {/* Summary */}
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
              <div className="text-xs text-slate-500 mb-1">
                Total Drawn
              </div>
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

        {/* Sources table */}
        {selectedProjectId && (
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
                      <tr
                        key={source.id}
                        className="border-t hover:bg-slate-50"
                      >
                        <td className="px-4 py-2 font-semibold">
                          {source.type}
                        </td>
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
                          {source.rate != null ? `${source.rate}%` : '-'}
                        </td>
                        <td className="px-4 py-2">
                          {source.fees != null ? `${source.fees}%` : '-'}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => handleDeleteSource(source.id)}
                            className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
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
        )}

        {/* Drawdowns table */}
        {selectedProjectId && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              Drawdown History
            </h2>
            {drawdowns.length === 0 ? (
              <p className="text-slate-600 text-sm">
                No drawdowns recorded yet.
              </p>
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
                    {drawdowns.map((d) => (
                      <tr
                        key={d.id}
                        className="border-t hover:bg-slate-50"
                      >
                        <td className="px-4 py-2">
                          {new Date(d.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2">
                          {d.source?.type ?? '-'}
                        </td>
                        <td className="px-4 py-2 text-right text-red-600">
                          {formatCurrency(d.amount)}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => handleDeleteDrawdown(d.id)}
                            className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
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
        )}

        {/* Add Source Modal */}
        {showSourceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <h2 className="text-xl font-bold mb-4">
                Add Financing Source
              </h2>
              <form onSubmit={handleCreateSource} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Type
                  </label>
                  <select
                    name="type"
                    value={sourceFormData.type}
                    onChange={handleSourceFormChange}
                    required
                    className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
                    min={0}
                    step="0.01"
                    value={sourceFormData.amount}
                    onChange={handleSourceFormChange}
                    required
                    className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Interest Rate - Optional
                  </label>
                  <input
                    type="number"
                    name="rate"
                    min={0}
                    step="0.01"
                    value={sourceFormData.rate ?? ''}
                    onChange={handleSourceFormChange}
                    className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Fees - Optional
                  </label>
                  <input
                    type="number"
                    name="fees"
                    min={0}
                    step="0.01"
                    value={sourceFormData.fees ?? ''}
                    onChange={handleSourceFormChange}
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
                    required
                    className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select Source --</option>
                    {sources.map((source) => (
                      <option key={source.id} value={source.id}>
                        {source.type} – {formatCurrency(source.amount)} (
                        Remaining {formatCurrency(source.remaining)})
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
                    min={0}
                    step="0.01"
                    value={drawdownFormData.amount}
                    onChange={handleDrawdownFormChange}
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
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
