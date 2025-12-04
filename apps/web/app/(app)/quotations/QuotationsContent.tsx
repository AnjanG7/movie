'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  FormEvent,
  ChangeEvent,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Film,
  FileText,
  Plus,
  Search,
  Eye,
  Trash2,
  Calendar,
  DollarSign,
  Loader2,
} from 'lucide-react';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

type TemplateType = 'FEATURE' | 'SERIES' | 'SHORT';

interface Project {
  id: string;
  title: string;
  baseCurrency: string;
}

interface Quotation {
  id: string;
  version: string;
  type: 'QUOTE' | 'BASELINE' | 'WORKING';
  template?: TemplateType;
  total?: number;
  createdAt: string;
  acceptedAt?: string;
}

interface CreateFormData {
  template: TemplateType;
  versionNo: string;
}

export default function QuotationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(
    undefined,
  );

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<CreateFormData>({
    template: 'FEATURE',
    versionNo: 'v1.0',
  });

  // Restore project selection from URL
  useEffect(() => {
    const pid = searchParams.get('projectId');
    if (pid && pid !== selectedProjectId) {
      setSelectedProjectId(pid);
    }
  }, [searchParams, selectedProjectId]);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/projects?limit=1000`, {
        credentials: 'include',
      });
      if (!response.ok) return;
      const result = await response.json();
      if (result.success) {
        setProjects(result.data.projects as Project[]);
      }
    } catch (error) {
      console.error('Error fetching projects', error);
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Fetch quotations for selected project
  const fetchQuotations = useCallback(async () => {
    if (!selectedProjectId) {
      setQuotations([]);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/quotations`,
        { credentials: 'include' },
      );
      if (!response.ok) return;
      const result = await response.json();
      if (result.success) {
        setQuotations(result.data as Quotation[]);
      }
    } catch (error) {
      console.error('Error fetching quotations', error);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  // ------- Handlers -------

  const handleProjectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value || undefined;
    setSelectedProjectId(id);
    const params = new URLSearchParams(searchParams.toString());
    if (id) params.set('projectId', id);
    else params.delete('projectId');
    router.push(`?${params.toString()}`);
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleTemplateChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      template: e.target.value as TemplateType,
    }));
  };

  const handleVersionChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      versionNo: e.target.value,
    }));
  };

  const handleCreateQuotation = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProjectId) {
      alert('Please select a project first');
      return;
    }
    if (!formData.versionNo.trim()) {
      alert('Please enter a version number');
      return;
    }

    const payload = {
      version: formData.versionNo.trim(),
      type: 'QUOTE',
      template: formData.template,
    };

    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/quotations`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to create quotation');
      }

      alert('Quotation created successfully');
      setShowCreateModal(false);
      setFormData({ template: 'FEATURE', versionNo: 'v1.0' });
      fetchQuotations();
    } catch (error: any) {
      console.error('Error creating quotation', error);
      alert(error.message || 'Failed to create quotation');
    }
  };

  const handleDeleteQuotation = async (quotationId: string) => {
    if (
      !selectedProjectId ||
      !confirm(
        'Are you sure you want to delete this quotation? This action cannot be undone.',
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/quotations/${quotationId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        },
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to delete quotation');
      }
      alert('Quotation deleted successfully');
      fetchQuotations();
    } catch (error: any) {
      console.error('Error deleting quotation', error);
      alert(error.message || 'Failed to delete quotation');
    }
  };

  const formatCurrency = (amount: number) => {
    const project = projects.find((p) => p.id === selectedProjectId);
    const currency = project?.baseCurrency ?? 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const filteredQuotations = quotations.filter((q) => {
    const term = searchTerm.toLowerCase();
    return (
      q.version.toLowerCase().includes(term) ||
      (q.template ?? '').toLowerCase().includes(term)
    );
  });

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  // ------- Render -------

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Investor Quotations
              </h1>
              <p className="text-lg text-gray-600">
                Create and manage professional film finance quotations.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-600 mb-1">
                Project
              </label>
              <select
                value={selectedProjectId ?? ''}
                onChange={handleProjectChange}
                className="h-11 min-w-[220px] rounded-xl border border-slate-300 px-3 bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select project...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            {selectedProject && (
              <div className="px-4 py-2 bg-white/60 backdrop-blur-sm rounded-xl border shadow-sm flex flex-col justify-center">
                <div className="flex items-center gap-2 text-sm text-gray-800">
                  <Film className="w-4 h-4 text-indigo-600" />
                  <span className="font-semibold">{selectedProject.title}</span>
                </div>
                <span className="text-xs text-gray-500">
                  Base currency {selectedProject.baseCurrency}
                </span>
              </div>
            )}

            {selectedProjectId && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg h-11 px-5 text-sm font-semibold text-white rounded-xl inline-flex items-center justify-center"
              >
                <Plus className="w-4 h-4 mr-1" />
                New Quotation
              </button>
            )}
          </div>
        </div>

        {/* Search & summary */}
        {selectedProjectId && (
          <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-2xl border border-slate-100 mb-6">
            <div className="px-8 pt-8 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                  <DollarSign className="w-7 h-7 text-indigo-600" />
                  Quotations {filteredQuotations.length}
                </div>
                <div className="text-lg text-slate-500">
                  Manage quotation versions and track approval status.
                </div>
              </div>
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search quotations..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10 w-64 h-11 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Table / empty states */}
        {projectsLoading ? (
          <div className="p-12 flex items-center justify-center gap-4 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span>Loading projects...</span>
          </div>
        ) : !selectedProjectId ? (
          <div className="text-center py-20 px-6 bg-white rounded-2xl shadow border border-slate-200">
            <Film className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Select a project
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Choose a project to view and manage its investor quotations.
            </p>
          </div>
        ) : loading ? (
          <div className="p-12 flex items-center justify-center gap-4 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span>Loading quotations...</span>
          </div>
        ) : filteredQuotations.length === 0 ? (
          <div className="text-center py-20 px-6 bg-white rounded-2xl shadow border border-slate-200">
            <FileText className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {searchTerm ? 'No matching quotations' : 'No quotations yet'}
            </h3>
            <p className="text-xl text-gray-500 mb-8 max-w-md mx-auto">
              {searchTerm
                ? 'Try adjusting your search terms.'
                : 'Create your first quotation to start planning project finances.'}
            </p>
            {!searchTerm && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-xl text-white rounded-xl h-12 px-8 text-lg font-semibold inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create First Quotation
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-2xl shadow border border-slate-100">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Version
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Template
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredQuotations.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {q.version}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {q.template ?? '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>
                          {new Date(q.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {q.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">
                      {q.total != null ? formatCurrency(q.total) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/quotations/${q.id}/view?projectId=${selectedProjectId}`
                            )
                          }
                          className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuotation(q.id)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create Quotation Modal */}
        {showCreateModal && selectedProjectId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Create Quotation
              </h2>
              <form onSubmit={handleCreateQuotation} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Version
                  </label>
                  <input
                    type="text"
                    value={formData.versionNo}
                    onChange={handleVersionChange}
                    placeholder="e.g., v1.0, Quote for Investor A"
                    className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template
                  </label>
                  <select
                    value={formData.template}
                    onChange={handleTemplateChange}
                    className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="FEATURE">Feature Film</option>
                    <option value="SERIES">Series</option>
                    <option value="SHORT">Short Film</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 h-9 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 h-9 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
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
