"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Film, Plus, Edit2, Trash2 } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Download } from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://film-finance-app.onrender.com/api";

interface Project {
  id: string;
  title: string;
  baseCurrency: string;
}

interface BudgetLine {
  id: string;
  phase: string;
  department: string | null;
  name: string;
  qty: number;
  rate: number;
  taxPercent: number;
  createdAt: string;
  updatedAt: string;
}

interface BudgetVersion {
  id: string;
  version: string;
  type: string;
  grandTotal: number;
  createdAt: string;
  updatedAt: string;
  lockedAt?: string;
  lines: BudgetLine[];
}

interface LineFormData {
  phase: string;
  department: string;
  name: string;
  qty: number;
  rate: number;
  taxPercent: number;
  vendor: string;
  notes: string;
}

export default function BudgetPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [budgetVersions, setBudgetVersions] = useState<BudgetVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<BudgetVersion | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [showAddLineModal, setShowAddLineModal] = useState(false);
  const [editingLine, setEditingLine] = useState<BudgetLine | null>(null);

  const [lineFormData, setLineFormData] = useState<LineFormData>({
    phase: "PRODUCTION",
    department: "",
    name: "",
    qty: 1,
    rate: 0,
    taxPercent: 0,
    vendor: "",
    notes: "",
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchBudgetVersions();
    }
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects?limit=1000`, {
        credentials: "include",
      });
      const result = await response.json();
      if (result.success) {
        setProjects(result.data.projects || []);

        const params = new URLSearchParams(window.location.search);
        const projectId = params.get("projectId");
        if (projectId) {
          setSelectedProjectId(projectId);
        }
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchBudgetVersions = async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/budget`,
        { credentials: "include" }
      );
      const result = await response.json();
      if (result.success) {
        const versions: BudgetVersion[] = result.data.versions || [];
        setBudgetVersions(versions);
        const workingBudget = versions.find(
          (v: BudgetVersion) => v.type === "WORKING"
        );
        setSelectedVersion(workingBudget || versions[0] || null);
      }
    } catch (error) {
      console.error("Error fetching budget versions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLine = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedVersion) {
      alert("Please select a budget version first");
      return;
    }

    try {
      const endpoint = editingLine
        ? `${API_BASE_URL}/projects/${selectedProjectId}/budget/lines/${editingLine.id}`
        : `${API_BASE_URL}/projects/${selectedProjectId}/budget/${selectedVersion.id}/lines`;

      const method = editingLine ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(lineFormData),
      });

      const result = await response.json();
      if (result.success) {
        alert(
          editingLine ? "Line updated successfully" : "Line added successfully"
        );
        setShowAddLineModal(false);
        setEditingLine(null);
        resetLineForm();
        fetchBudgetVersions();
      } else {
        alert(result.message || "Failed to save line");
      }
    } catch (error) {
      console.error("Error saving line:", error);
      alert("Failed to save line");
    }
  };

  const handleEditLine = (line: BudgetLine) => {
    setEditingLine(line);
    setLineFormData({
      phase: line.phase,
      department: line.department || "",
      name: line.name,
      qty: line.qty,
      rate: line.rate,
      taxPercent: line.taxPercent,
      vendor: "",
      notes: "",
    });
    setShowAddLineModal(true);
  };

  const handleDeleteLine = async (lineId: string) => {
    if (!confirm("Delete this budget line?")) return;
    if (!selectedVersion) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/budget/lines/${lineId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const result = await response.json();
      if (result.success) {
        alert("Line deleted successfully");
        fetchBudgetVersions();
      } else {
        alert(result.message || "Failed to delete line");
      }
    } catch (error) {
      console.error("Error deleting line:", error);
      alert("Failed to delete line");
    }
  };

  const resetLineForm = () => {
    setLineFormData({
      phase: "PRODUCTION",
      department: "",
      name: "",
      qty: 1,
      rate: 0,
      taxPercent: 0,
      vendor: "",
      notes: "",
    });
  };

  const formatCurrency = (amount: number) => {
    const project = projects.find((p) => p.id === selectedProjectId);
    const currency = project?.baseCurrency || "USD";
    return `${currency} ${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  const calculateLineTotal = (line: BudgetLine) => {
    return line.qty * line.rate * (1 + line.taxPercent / 100);
  };

  const calculateTotalsByPhase = () => {
    if (!selectedVersion) return {} as Record<string, number>;
    const totals: Record<string, number> = {};
    selectedVersion.lines.forEach((line) => {
      const lineTotal = calculateLineTotal(line);
      const phase = line.phase;
      if (totals[phase] === undefined) {
        totals[phase] = 0;
      }
      totals[phase] += lineTotal;
    });
    return totals;
  };

  const calculateGrandTotal = () => {
    if (!selectedVersion) return 0;
    return selectedVersion.lines.reduce(
      (sum, line) => sum + calculateLineTotal(line),
      0
    );
  };

  const handleProjectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedProjectId(e.target.value);
  };

  const handleVersionChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const version = budgetVersions.find((v) => v.id === e.target.value);
    setSelectedVersion(version || null);
  };

  const handleLineFieldChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "qty" || name === "rate" || name === "taxPercent") {
      setLineFormData((prev) => ({
        ...prev,
        [name]: Number(value),
      }));
    } else {
      setLineFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const exportToPDF = () => {
    if (!selectedVersion) {
      alert("No budget version selected");
      return;
    }

    const project = projects.find((p) => p.id === selectedProjectId);
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const colors = {
      primary: [37, 99, 235] as [number, number, number],
      text: [30, 41, 59] as [number, number, number],
      lightText: [100, 116, 139] as [number, number, number],
      lightBg: [248, 250, 252] as [number, number, number],
      border: [226, 232, 240] as [number, number, number],
    };

    let yPos = 20;

    // ===== HEADER =====
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, pageWidth, 50, "F");

    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("BUDGET REPORT", 15, 22);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Film Finance Management System", 15, 32);

    doc.setFontSize(9);
    doc.text(
      `Generated: ${new Date().toLocaleDateString()}`,
      pageWidth - 15,
      22,
      { align: "right" }
    );

    doc.setTextColor(...colors.text);
    yPos = 60;

    // ===== PROJECT & VERSION INFO =====
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.primary);
    doc.text("PROJECT & VERSION INFORMATION", 15, yPos);

    yPos += 8;

    doc.setFillColor(...colors.lightBg);
    doc.setDrawColor(...colors.border);
    doc.roundedRect(15, yPos, pageWidth - 30, 30, 2, 2, "FD");

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.lightText);
    doc.text("Project:", 20, yPos + 8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.text);
    doc.text(project?.title || "N/A", 50, yPos + 8);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.lightText);
    doc.text("Version:", 20, yPos + 16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.text);
    doc.text(
      `${selectedVersion.version} (${selectedVersion.type})`,
      50,
      yPos + 16
    );

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.lightText);
    doc.text("Created:", 20, yPos + 24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.text);
    doc.text(formatDate(selectedVersion.createdAt), 50, yPos + 24);

    if (selectedVersion.lockedAt) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(220, 38, 38);
      doc.text("🔒 LOCKED", pageWidth - 30, yPos + 24, { align: "right" });
    }

    yPos += 40;

    // ===== SUMMARY BY PHASE =====
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.primary);
    doc.text("SUMMARY BY PHASE", 15, yPos);

    yPos += 5;

    const phaseData = Object.entries(calculateTotalsByPhase()).map(
      ([phase, total]) => [
        phase,
        formatCurrency(total),
        `${((total / calculateGrandTotal()) * 100).toFixed(1)}%`,
      ]
    );

    autoTable(doc, {
      startY: yPos,
      head: [["Phase", "Total", "% of Budget"]],
      body: phaseData,
      foot: [["TOTAL", formatCurrency(calculateGrandTotal()), "100%"]],
      theme: "striped",
      headStyles: {
        fillColor: colors.primary,
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: colors.text,
        fontStyle: "bold",
      },
      styles: { fontSize: 9 },
      columnStyles: {
        1: { halign: "right" },
        2: { halign: "right" },
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // ===== BUDGET LINES (Detailed) =====
    // Check if we need a new page
    if (yPos > pageHeight - 100) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.primary);
    doc.text("DETAILED BUDGET LINES", 15, yPos);

    yPos += 5;

    const lineData = selectedVersion.lines.map((line) => [
      line.phase,
      line.department || "-",
      line.name,
      line.qty.toString(),
      formatCurrency(line.rate),
      `${line.taxPercent || 0}%`,
      formatCurrency(calculateLineTotal(line)),
      formatDate(line.createdAt),
      formatDate(line.updatedAt),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [
        [
          "Phase",
          "Dept",
          "Line Item",
          "Qty",
          "Rate",
          "Tax",
          "Total",
          "Created",
          "Updated",
        ],
      ],
      body: lineData,
      theme: "striped",
      headStyles: {
        fillColor: colors.primary,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
      },
      bodyStyles: { fontSize: 7 },
      columnStyles: {
        3: { halign: "center" },
        4: { halign: "right" },
        5: { halign: "center" },
        6: { halign: "right" },
        7: { halign: "center" },
        8: { halign: "center" },
      },
      margin: { left: 10, right: 10 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // ===== FOOTER ON ALL PAGES =====
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.5);
      doc.line(10, pageHeight - 15, pageWidth - 10, pageHeight - 15);

      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colors.lightText);
      doc.text(
        `${project?.title || "Budget"} - ${selectedVersion.version}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: "center" }
      );
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 10, pageHeight - 8, {
        align: "right",
      });
    }

    const filename = `Budget_${project?.title}_${selectedVersion.version}_${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(filename);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Film className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900">
                Budget Management
              </h1>
              <p className="text-slate-600 text-lg">
                Track production, post, and publicity costs by phase.
              </p>
            </div>
          </div>

          {selectedProject && selectedVersion && (
            <div className="bg-white/70 border border-slate-200 rounded-xl px-4 py-3 shadow-sm text-sm text-slate-700">
              <div className="font-semibold">{selectedProject.title}</div>
              <div>
                Version:{" "}
                <span className="font-medium">
                  {selectedVersion.version} ({selectedVersion.type})
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Selectors */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-md p-5 mb-8 flex flex-wrap gap-4 items-center">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-slate-700">
              Select Project
            </label>
            <select
              value={selectedProjectId}
              onChange={handleProjectChange}
              className="h-11 min-w-[220px] rounded-lg border border-slate-300 px-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Project --</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>

          {selectedProjectId && budgetVersions.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-slate-700">
                Budget Version
              </label>
              <select
                value={selectedVersion?.id || ""}
                onChange={handleVersionChange}
                className="h-11 min-w-[220px] rounded-lg border border-slate-300 px-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Version --</option>
                {budgetVersions.map((version) => (
                  <option key={version.id} value={version.id}>
                    {version.version} ({version.type})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-3 ml-auto">
            {selectedProjectId && selectedVersion && (
              <button
                onClick={exportToPDF}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-semibold"
              >
                <Download className="w-5 h-5" />
                Download PDF
              </button>
            )}

            {selectedVersion && !selectedVersion.lockedAt && (
              <button
                type="button"
                onClick={() => {
                  setEditingLine(null);
                  resetLineForm();
                  setShowAddLineModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 h-11 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Budget Line
              </button>
            )}
          </div>
        </div>

        {/* Modal */}
        {showAddLineModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingLine ? "Edit Budget Line" : "Add Budget Line"}
              </h2>
              <form onSubmit={handleAddLine} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Phase
                  </label>
                  <select
                    name="phase"
                    value={lineFormData.phase}
                    onChange={handleLineFieldChange}
                    className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="DEVELOPMENT">Development</option>
                    <option value="PRODUCTION">Production</option>
                    <option value="POST">Post-Production</option>
                    <option value="PUBLICITY">Publicity</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Department (Optional)
                  </label>
                  <input
                    name="department"
                    type="text"
                    value={lineFormData.department}
                    onChange={handleLineFieldChange}
                    placeholder="e.g., Camera, Lighting, Art Dept"
                    className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Line Item Name
                  </label>
                  <input
                    name="name"
                    type="text"
                    value={lineFormData.name}
                    onChange={handleLineFieldChange}
                    placeholder="e.g., Director Fee, Camera Rental"
                    required
                    className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Qty
                    </label>
                    <input
                      name="qty"
                      type="number"
                      value={lineFormData.qty}
                      onChange={handleLineFieldChange}
                      min={1}
                      required
                      className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Rate
                    </label>
                    <input
                      name="rate"
                      type="number"
                      value={lineFormData.rate}
                      onChange={handleLineFieldChange}
                      min={0}
                      step="0.01"
                      required
                      className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Tax %
                    </label>
                    <input
                      name="taxPercent"
                      type="number"
                      value={lineFormData.taxPercent}
                      onChange={handleLineFieldChange}
                      min={0}
                      step="0.1"
                      className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Vendor (Optional)
                  </label>
                  <input
                    name="vendor"
                    type="text"
                    value={lineFormData.vendor}
                    onChange={handleLineFieldChange}
                    placeholder="Vendor name"
                    className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    value={lineFormData.notes}
                    onChange={handleLineFieldChange}
                    rows={3}
                    placeholder="Additional notes"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <p className="text-sm text-slate-600">
                  <span className="font-semibold">Line Total:</span>{" "}
                  {formatCurrency(
                    lineFormData.qty *
                      lineFormData.rate *
                      (1 + lineFormData.taxPercent / 100)
                  )}
                </p>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddLineModal(false);
                      setEditingLine(null);
                      resetLineForm();
                    }}
                    className="px-4 h-10 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 h-10 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    {editingLine ? "Update Line" : "Add Line"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Main content */}
        {selectedProjectId && (
          <div>
            {loading ? (
              <p className="text-center text-slate-600 mt-10">Loading...</p>
            ) : !selectedVersion ? (
              <div className="text-center p-10 bg-white/80 rounded-2xl border border-slate-200 shadow-md">
                <p className="text-base text-slate-700 mb-2">
                  No budget version found for this project.
                </p>
                <p className="text-sm text-slate-500">
                  Create a quotation first, then convert it to a baseline
                  budget.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    router.push(`/quotations?projectId=${selectedProjectId}`)
                  }
                  className="mt-4 px-5 h-10 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Go to Quotations
                </button>
              </div>
            ) : (
              <>
                {/* Header info */}
                <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-100">
                  <h2 className="text-lg font-semibold text-slate-900 mb-2">
                    {selectedVersion.version} ({selectedVersion.type})
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-slate-600">Created</div>
                      <div className="font-semibold text-slate-900">
                        {formatDate(selectedVersion.createdAt)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-600">Updated</div>
                      <div className="font-semibold text-slate-900">
                        {formatDate(selectedVersion.updatedAt)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-600">Status</div>
                      <div className="font-semibold text-slate-900">
                        {selectedVersion.lockedAt ? "🔒 Locked" : "Active"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-600">Total Budget</div>
                      <div className="font-semibold text-blue-600">
                        {formatCurrency(calculateGrandTotal())}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary by Phase */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">
                    Summary by Phase
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                    <table className="min-w-full text-sm">
                      <thead className="bg-blue-700 text-white">
                        <tr>
                          <th className="px-4 py-2 text-left">Phase</th>
                          <th className="px-4 py-2 text-right">Total</th>
                          <th className="px-4 py-2 text-right">% of Budget</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(calculateTotalsByPhase()).map(
                          ([phase, total]) => (
                            <tr
                              key={phase}
                              className="border-t hover:bg-slate-50"
                            >
                              <td className="px-4 py-2 font-semibold">
                                {phase}
                              </td>
                              <td className="px-4 py-2 text-right">
                                {formatCurrency(total)}
                              </td>
                              <td className="px-4 py-2 text-right">
                                {(
                                  (total / calculateGrandTotal()) *
                                  100
                                ).toFixed(1)}
                                %
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                      <tfoot className="bg-slate-50 font-semibold border-t-2">
                        <tr>
                          <td className="px-4 py-2">TOTAL</td>
                          <td className="px-4 py-2 text-right text-blue-700">
                            {formatCurrency(calculateGrandTotal())}
                          </td>
                          <td className="px-4 py-2 text-right">100%</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Detailed lines */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">
                    Budget Lines ({selectedVersion.lines.length})
                  </h3>
                  {selectedVersion.lines.length === 0 ? (
                    <p className="text-sm text-slate-600">
                      No budget lines yet. Add your first line item above.
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-2 text-left">Phase</th>
                            <th className="px-4 py-2 text-left">Department</th>
                            <th className="px-4 py-2 text-left">Line Item</th>
                            <th className="px-4 py-2 text-right">Qty</th>
                            <th className="px-4 py-2 text-right">Rate</th>
                            <th className="px-4 py-2 text-right">Tax %</th>
                            <th className="px-4 py-2 text-right">Total</th>
                            <th className="px-4 py-2 text-center">Created</th>
                            <th className="px-4 py-2 text-center">Updated</th>
                            {!selectedVersion.lockedAt && (
                              <th className="px-4 py-2 text-left">Actions</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {selectedVersion.lines.map((line) => (
                            <tr
                              key={line.id}
                              className="border-t hover:bg-slate-50"
                            >
                              <td className="px-4 py-2">{line.phase}</td>
                              <td className="px-4 py-2">
                                {line.department || "-"}
                              </td>
                              <td className="px-4 py-2">{line.name}</td>
                              <td className="px-4 py-2 text-right">
                                {line.qty}
                              </td>
                              <td className="px-4 py-2 text-right">
                                {line.rate.toLocaleString()}
                              </td>
                              <td className="px-4 py-2 text-right">
                                {line.taxPercent}%
                              </td>
                              <td className="px-4 py-2 text-right font-semibold">
                                {formatCurrency(calculateLineTotal(line))}
                              </td>
                              <td className="px-4 py-2 text-center text-xs text-slate-600">
                                {formatDate(line.createdAt)}
                              </td>
                              <td className="px-4 py-2 text-center text-xs text-slate-600">
                                {formatDate(line.updatedAt)}
                              </td>
                              {!selectedVersion.lockedAt && (
                                <td className="px-4 py-2">
                                  <button
                                    type="button"
                                    onClick={() => handleEditLine(line)}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-slate-300 mr-2 hover:bg-slate-50"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteLine(line.id)}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-red-300 text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Delete
                                  </button>
                                </td>
                              )}
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
        )}
      </div>
    </div>
  );
}
