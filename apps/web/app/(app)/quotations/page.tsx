'use client';

import React, { useState, useEffect, useCallback, FormEvent, ChangeEvent } from 'react';
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface Project {
  id: string;
  title: string;
  baseCurrency: string;
}

interface Quotation {
  id: string;
  version: string;
  type: string;
  template?: string;
  total: number;
  createdAt: string;
  acceptedAt?: string;
}

type TemplateType = 'FEATURE' | 'SERIES' | 'SHORT';

export default function QuotationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<{
    template: TemplateType;
    versionNo: string;
  }>({
    template: 'FEATURE',
    versionNo: 'v1.0',
  });

  // Restore project selection from URL
  useEffect(() => {
    const projectId = searchParams.get('projectId');
    if (projectId && selectedProjectId !== projectId) {
      setSelectedProjectId(projectId);
    }
  }, [searchParams, selectedProjectId]);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchQuotations();
    } else {
      setQuotations([]);
    }
  }, [selectedProjectId]);

  const fetchProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/projects?limit=1000`, {
        credentials: 'include',
      });

      if (!response.ok) {
        console.error('Failed to fetch projects:', response.statusText);
        return;
      }

      const result = await response.json();
      if (result.success) {
        setProjects(result.data.projects || []);
      } else {
        console.error(result.message || 'Failed to load projects');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  const fetchQuotations = useCallback(async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/quotations`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        console.error('Failed to fetch quotations:', response.statusText);
        return;
      }

      const result = await response.json();
      if (result.success) {
        setQuotations(result.data || []);
      } else {
        console.error(result.message || 'Failed to load quotations');
      }
    } catch (error) {
      console.error('Error fetching quotations:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

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

    try {
      const payload = {
        template: formData.template,
        version: formData.versionNo.trim(), // backend expects "version"
      };

      const response = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/quotations`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        alert('Quotation created successfully');
        setShowCreateModal(false);
        setFormData({ template: 'FEATURE', versionNo: 'v1.0' });
        fetchQuotations();
      } else {
        alert(result.message || 'Failed to create quotation');
      }
    } catch (error: any) {
      console.error('Error creating quotation:', error);
      alert(error.message || 'Failed to create quotation');
    }
  };

  const handleDeleteQuotation = async (quotationId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this quotation? This action cannot be undone.'
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
        }
      );

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        alert('Quotation deleted successfully');
        fetchQuotations();
      } else {
        alert(result.message || 'Failed to delete quotation');
      }
    } catch (error: any) {
      console.error('Error deleting quotation:', error);
      alert(error.message || 'Failed to delete quotation');
    }
  };

  const formatCurrency = (amount: number) => {
    const project = projects.find((p) => p.id === selectedProjectId);
    const currency = project?.baseCurrency || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const filteredQuotations = quotations.filter((quote) => {
    const term = searchTerm.toLowerCase();
    return (
      quote.version.toLowerCase().includes(term) ||
      (quote.template || '').toLowerCase().includes(term)
    );
  });

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const handleTemplateChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      template: e.target.value as TemplateType,
    });
  };

  const handleVersionChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      versionNo: e.target.value,
    });
  };

  const handleProjectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedProjectId(e.target.value);
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Investor Quotations
                </h1>
                <p className="text-xl text-gray-600 mt-1">
                  Create and manage professional film finance quotations
                </p>
              </div>
            </div>
          </div>

          {selectedProject && (
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-xl border shadow-sm">
                <Film className="w-5 h-5 text-indigo-600" />
                <span className="font-semibold text-gray-900">{selectedProject.title}</span>
                <span className="text-sm text-gray-500">
                  ({selectedProject.baseCurrency})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg h-12 px-8 text-lg font-semibold text-white rounded-xl"
              >
                <Plus className="w-5 h-5 mr-2 inline-block" />
                New Quotation
              </button>
            </div>
          )}
        </div>

        {/* Project Selector */}
        <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl mb-8 border border-slate-100">
          <div className="p-8">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              <div className="flex-1">
                <label className="text-lg font-semibold text-gray-900 mb-3 block">
                  Select Project
                </label>
                <select
                  value={selectedProjectId}
                  onChange={handleProjectChange}
                  className="w-full h-14 rounded-xl border border-slate-200 bg-white px-4 text-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Choose a project...</option>
                  {projectsLoading ? (
                    <option disabled>Loading projects...</option>
                  ) : (
                    projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.title}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {selectedProjectId && (
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="h-12 px-6 rounded-xl border border-slate-200 bg-white text-slate-700 flex items-center gap-2 shadow-sm hover:bg-slate-50"
                  >
                    <Search className="w-4 h-4" />
                    Export All
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quotations Table / Empty State */}
        {selectedProjectId ? (
          <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-2xl border border-slate-100">
            <div className="px-8 pt-8 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                  <DollarSign className="w-7 h-7 text-indigo-600" />
                  Quotations ({filteredQuotations.length})
                </div>
                <div className="text-lg text-slate-500">
                  Manage quotation versions and track approval status
                </div>
              </div>
              {quotations.length > 0 && (
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search quotations..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="pl-11 w-64 h-12 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>

            {loading ? (
              <div className="p-12 flex items-center justify-center gap-4 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span>Loading quotations...</span>
              </div>
            ) : filteredQuotations.length === 0 ? (
              <div className="text-center py-20 px-6">
                <FileText className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {searchTerm ? 'No matching quotations' : 'No quotations yet'}
                </h3>
                <p className="text-xl text-gray-500 mb-8 max-w-md mx-auto">
                  {searchTerm
                    ? 'Try adjusting your search terms'
                    : 'Create your first quotation to start planning project finances.'}
                </p>
                {!searchTerm && (
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-xl text-white rounded-xl h-12 px-8 text-lg font-semibold"
                  >
                    <Plus className="w-5 h-5 mr-2 inline-block" />
                    Create First Quotation
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-t border-slate-100">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Version
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Template
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQuotations.map((quote) => (
                      <tr
                        key={quote.id}
                        className="border-b border-slate-100 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 transition-all"
                      >
                        <td className="px-6 py-4 text-xl font-bold text-slate-900">
                          {quote.version}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800">
                            {quote.template || 'Custom'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-2xl text-slate-900">
                          {formatCurrency(quote.total)}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(quote.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {quote.acceptedAt ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Accepted
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border border-amber-200 text-amber-800 bg-amber-50">
                              Draft
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/quotations/${quote.id}/view?projectId=${selectedProjectId}`
                              )
                            }
                            className="inline-flex items-center h-10 px-4 rounded-lg text-sm font-medium text-indigo-700 hover:bg-indigo-100"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuotation(quote.id)}
                            className="inline-flex items-center h-10 px-4 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
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
        ) : (
          <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-100">
            <div className="p-20 text-center">
              <Film className="w-24 h-24 text-gray-300 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Select a Project</h2>
              <p className="text-xl text-gray-500 mb-8 max-w-md mx-auto">
                Choose a project from the dropdown above to view and manage its investor
                quotations.
              </p>
            </div>
          </div>
        )}

        {/* Create Quotation Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <div className="flex items-center gap-3">
                  <FileText className="w-7 h-7" />
                  <h2 className="text-2xl font-bold">New Investor Quotation</h2>
                </div>
              </div>
              <form onSubmit={handleCreateQuotation} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    Template
                  </label>
                  <select
                    value={formData.template}
                    onChange={handleTemplateChange}
                    className="w-full h-12 rounded-xl border border-slate-200 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="FEATURE">Feature Film (10% contingency)</option>
                    <option value="SERIES">TV Series (8% contingency)</option>
                    <option value="SHORT">Short Film (15% contingency)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    Version Number
                  </label>
                  <input
                    type="text"
                    value={formData.versionNo}
                    onChange={handleVersionChange}
                    placeholder="e.g., v1.0, v1.1, v2.0"
                    className="w-full h-12 rounded-xl border border-slate-200 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
              
                  <p className="text-xs text-slate-500 mt-2">
                    Use semantic versioning (v1.0 → v1.1 → v2.0)
                  </p>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 h-12 px-6 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-12 px-6 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold shadow-lg transition-all"
                  >
                    Create Quotation
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
