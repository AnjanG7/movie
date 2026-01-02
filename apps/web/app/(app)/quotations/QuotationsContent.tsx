"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  FormEvent,
  ChangeEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Download } from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://film-finance-app.onrender.com/api";

type TemplateType = "FEATURE" | "SERIES" | "SHORT";

interface Project {
  id: string;
  title: string;
  baseCurrency: string;
}

interface Quotation {
  id: string;
  version: string;
  type: "QUOTE" | "BASELINE" | "WORKING";
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
  const [selectedProjectId, setSelectedProjectId] = useState<
    string | undefined
  >(undefined);

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState<CreateFormData>({
    template: "FEATURE",
    versionNo: "v1.0",
  });

  // Restore project selection from URL
  useEffect(() => {
    const pid = searchParams.get("projectId");
    if (pid && pid !== selectedProjectId) {
      setSelectedProjectId(pid);
    }
  }, [searchParams, selectedProjectId]);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/projects?limit=1000`, {
        credentials: "include",
      });
      if (!response.ok) return;
      const result = await response.json();
      if (result.success) {
        setProjects(result.data.projects as Project[]);

        // ✅ ADD THESE LINES - Auto-select from URL
        const params = new URLSearchParams(window.location.search);
        const projectId = params.get("projectId");
        if (projectId) {
          setSelectedProjectId(projectId);
        }
      }
    } catch (error) {
      console.error("Error fetching projects", error);
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
        { credentials: "include" }
      );
      if (!response.ok) return;
      const result = await response.json();
      if (result.success) {
        setQuotations(result.data as Quotation[]);
      }
    } catch (error) {
      console.error("Error fetching quotations", error);
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
    if (id) params.set("projectId", id);
    else params.delete("projectId");
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
      alert("Please select a project first");
      return;
    }
    if (!formData.versionNo.trim()) {
      alert("Please enter a version number");
      return;
    }

    const payload = {
      version: formData.versionNo.trim(),
      type: "QUOTE",
      template: formData.template,
    };

    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/quotations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to create quotation");
      }

      alert("Quotation created successfully");
      setShowCreateModal(false);
      setFormData({ template: "FEATURE", versionNo: "v1.0" });
      fetchQuotations();
    } catch (error: any) {
      console.error("Error creating quotation", error);
      alert(error.message || "Failed to create quotation");
    }
  };

  const handleDeleteQuotation = async (quotationId: string) => {
    if (
      !selectedProjectId ||
      !confirm(
        "Are you sure you want to delete this quotation? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/quotations/${quotationId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to delete quotation");
      }
      alert("Quotation deleted successfully");
      fetchQuotations();
    } catch (error: any) {
      console.error("Error deleting quotation", error);
      alert(error.message || "Failed to delete quotation");
    }
  };

  const formatCurrency = (amount: number) => {
    const project = projects.find((p) => p.id === selectedProjectId);
    const currency = project?.baseCurrency ?? "USD";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const filteredQuotations = quotations.filter((q) => {
    const term = searchTerm.toLowerCase();
    return (
      q.version.toLowerCase().includes(term) ||
      (q.template ?? "").toLowerCase().includes(term)
    );
  });

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const exportToPDF = (quotation: any) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text("QUOTATION", 14, 20);

    doc.setFontSize(11);
    doc.text(`Version: ${quotation.version}`, 14, 32);
    doc.text(`Type: ${quotation.type}`, 14, 38);
    doc.text(`Template: ${quotation.template || "N/A"}`, 14, 44);
    doc.text(
      `Created: ${new Date(quotation.createdAt).toLocaleDateString()}`,
      14,
      50
    );

    if (quotation.lockedAt) {
      doc.setTextColor(220, 38, 38);
      doc.text("LOCKED", 14, 56);
      doc.setTextColor(0, 0, 0);
    }

    // Total Summary Box
    doc.setFillColor(240, 248, 255);
    doc.rect(14, 65, 180, 15, "F");
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`Total: ${formatCurrency(quotation.total || 0)}`, 16, 75);
    doc.setFont("helvetica", "normal");

    // Assumptions
    if (quotation.assumptions) {
      doc.setFontSize(12);
      doc.text("Assumptions", 14, 92);
      doc.setFontSize(9);
      doc.text(`Currency: ${quotation.assumptions.currency || "USD"}`, 16, 98);
      doc.text(`Tax: ${quotation.assumptions.taxPercent || 0}%`, 16, 104);
      doc.text(
        `Contingency: ${quotation.assumptions.contingencyPercent || 0}%`,
        60,
        98
      );
      doc.text(
        `Insurance: ${quotation.assumptions.insurancePercent || 0}%`,
        60,
        104
      );
    }

    // Budget Lines
    if (quotation.lines && quotation.lines.length > 0) {
      doc.setFontSize(14);
      doc.text("Budget Lines", 14, 118);

      const lineData = quotation.lines.map((line: any) => {
        const subtotal = line.qty * line.rate;
        const tax = subtotal * ((line.taxPercent || 0) / 100);
        const total = subtotal + tax;

        return [
          line.phase,
          line.department || "-",
          line.name,
          line.qty.toString(),
          line.rate.toLocaleString(),
          `${line.taxPercent || 0}%`,
          total.toLocaleString(),
        ];
      });

      autoTable(doc, {
        startY: 123,
        head: [["Phase", "Dept", "Item", "Qty", "Rate", "Tax", "Total"]],
        body: lineData,
        foot: [
          [
            "",
            "",
            "",
            "",
            "",
            "GRAND TOTAL:",
            (quotation.total || 0).toLocaleString(),
          ],
        ],
        theme: "striped",
        headStyles: { fillColor: [59, 130, 246] },
        footStyles: {
          fillColor: [241, 245, 249],
          textColor: [0, 0, 0],
          fontStyle: "bold",
        },
        styles: { fontSize: 8 },
        columnStyles: {
          3: { halign: "right" },
          4: { halign: "right" },
          5: { halign: "right" },
          6: { halign: "right" },
        },
      });
    }

    // ROI Metrics
    if (quotation.metrics) {
      const finalY = (doc as any).lastAutoTable?.finalY + 15 || 180;
      doc.setFontSize(14);
      doc.text("ROI Metrics", 14, finalY);

      const metricsData = [
        ["Total Cost", formatCurrency(quotation.metrics.totalCost || 0)],
        [
          "Projected Revenue",
          formatCurrency(quotation.metrics.projectedRevenue || 0),
        ],
        [
          "Distribution Fees",
          formatCurrency(quotation.metrics.distributionFees || 0),
        ],
        ["Net Revenue", formatCurrency(quotation.metrics.netRevenue || 0)],
        ["Profit", formatCurrency(quotation.metrics.profit || 0)],
        ["ROI", `${quotation.metrics.roi?.toFixed(1) || 0}%`],
        [
          "Profit Margin",
          `${quotation.metrics.profitMargin?.toFixed(1) || 0}%`,
        ],
      ];

      autoTable(doc, {
        startY: finalY + 5,
        body: metricsData,
        theme: "plain",
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 60 },
          1: { halign: "right" },
        },
      });
    }

    // Financing Plan
    if (
      quotation.financingPlan?.sources &&
      quotation.financingPlan.sources.length > 0
    ) {
      const currentY = (doc as any).lastAutoTable?.finalY + 15 || 200;

      let startY: number;

      if (currentY > 250) {
        doc.addPage();
        doc.setFontSize(14);
        doc.text("Financing Plan", 14, 20);
        startY = 25;
      } else {
        doc.setFontSize(14);
        doc.text("Financing Plan", 14, currentY);
        startY = currentY + 5;
      }

      const financingData = quotation.financingPlan.sources.map(
        (source: any) => [
          source.type,
          source.description || "-",
          formatCurrency(source.amount || 0),
          source.rate ? `${source.rate}%` : "-",
        ]
      );

      autoTable(doc, {
        startY: startY,
        head: [["Type", "Description", "Amount", "Rate"]],
        body: financingData,
        theme: "striped",
        headStyles: { fillColor: [34, 197, 94] },
        columnStyles: {
          2: { halign: "right" },
          3: { halign: "right" },
        },
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: "center" }
      );
      doc.text(
        `Generated on ${new Date().toLocaleDateString()}`,
        14,
        doc.internal.pageSize.height - 10
      );
    }

    // Save
    const filename = `Quotation_${quotation.version}_${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(filename);
  };

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
                value={selectedProjectId ?? ""}
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
              {searchTerm ? "No matching quotations" : "No quotations yet"}
            </h3>
            <p className="text-xl text-gray-500 mb-8 max-w-md mx-auto">
              {searchTerm
                ? "Try adjusting your search terms."
                : "Create your first quotation to start planning project finances."}
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
                      {q.template ?? "-"}
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
                      {q.total != null ? formatCurrency(q.total) : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* View Button */}
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/quotations/${q.id}/view?projectId=${selectedProjectId}`
                            )
                          }
                          className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="View Quotation"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Download PDF Button */}
                        <button
                          type="button"
                          onClick={() => exportToPDF(q)}
                          className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteQuotation(q.id)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete Quotation"
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
