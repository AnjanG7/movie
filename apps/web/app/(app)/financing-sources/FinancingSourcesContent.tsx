"use client";
import React, { useState, useEffect, FormEvent, ChangeEvent } from "react";
import {
  DollarSign,
  TrendingUp,
  Plus,
  Trash2,
  PiggyBank,
  Download,
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const APIBASEURL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000/api";

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
  sourceQuotationId?: string;
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
  createdAt: string;
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

// PDF Export Function
// PDF Export Function - IMPROVED
// PDF Export Function - FIXED ALIGNMENT
const exportFinancingToPDF = (
  sources: FinancingSource[],
  drawdowns: Drawdown[],
  projectTitle: string,
  currency: string
) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const colors = {
      primary: [34, 197, 94] as [number, number, number],
      secondary: [59, 130, 246] as [number, number, number],
      text: [30, 41, 59] as [number, number, number],
      lightText: [100, 116, 139] as [number, number, number],
      lightBg: [248, 250, 252] as [number, number, number],
      border: [226, 232, 240] as [number, number, number],
      red: [220, 38, 38] as [number, number, number],
      green: [34, 197, 94] as [number, number, number],
    };

    // Helper function to safely format dates
    const formatDateSafe = (dateString: string | undefined): string => {
      try {
        if (!dateString) return "—";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "—";
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
      } catch {
        return "—";
      }
    };

    // Helper function to format currency with proper decimals
    const formatCurrencySafe = (
      amount: number | string | undefined
    ): string => {
      try {
        if (amount === undefined || amount === null) return `${currency} 0.00`;
        const numAmount =
          typeof amount === "string" ? parseFloat(amount) : amount;
        if (isNaN(numAmount) || !isFinite(numAmount)) return `${currency} 0.00`;

        return `${currency} ${numAmount.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
      } catch {
        return `${currency} 0.00`;
      }
    };

    // ===== HEADER =====
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, pageWidth, 50, "F");

    doc.setFontSize(28);
    doc.setTextColor(255, 255, 255);
    doc.text("💰", 15, 22);

    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("FINANCING SOURCES", 35, 22);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Film Finance Management System", 35, 30);
    doc.setFontSize(8);
    doc.text(projectTitle, 35, 37);

    doc.setFontSize(10);
    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    doc.text(today, pageWidth - 15, 26, { align: "right" });

    doc.setTextColor(...colors.text);

    let yPos = 60;

    // ===== SUMMARY =====
    const totalFinancing = sources.reduce((sum, s) => sum + (s.amount || 0), 0);
    const totalDrawn = sources.reduce((sum, s) => sum + (s.totalDrawn || 0), 0);
    const totalRemaining = sources.reduce(
      (sum, s) => sum + (s.remaining || 0),
      0
    );
    const usedPercentage =
      totalFinancing > 0 ? (totalDrawn / totalFinancing) * 100 : 0;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.primary);
    doc.text("SUMMARY", 15, yPos);

    yPos += 8;

    doc.setFillColor(...colors.lightBg);
    doc.setDrawColor(...colors.border);
    doc.roundedRect(15, yPos, pageWidth - 30, 40, 2, 2, "FD");

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.lightText);

    // Left Column
    doc.text("Total Allocated:", 20, yPos + 8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.text);
    doc.text(formatCurrencySafe(totalFinancing), 20, yPos + 14);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.lightText);
    doc.text("Total Remaining:", 20, yPos + 22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.green);
    doc.text(formatCurrencySafe(totalRemaining), 20, yPos + 28);

    // Right Column
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.lightText);
    doc.text("Total Used:", 90, yPos + 8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.red);
    doc.text(formatCurrencySafe(totalDrawn), 90, yPos + 14);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.lightText);
    doc.text("Usage Rate:", 90, yPos + 22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.text);
    doc.text(`${usedPercentage.toFixed(1)}%`, 90, yPos + 28);

    yPos += 48;

    // ===== FINANCING SOURCES TABLE =====
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.primary);
    doc.text("FINANCING SOURCES", 15, yPos);

    yPos += 5;

    if (sources.length > 0) {
      const sourceData = sources.map((s) => [
        s.type || "N/A",
        formatCurrencySafe(s.amount),
        formatCurrencySafe(s.totalDrawn),
        formatCurrencySafe(s.remaining),
        s.rate ? `${s.rate}%` : "—",
        s.fees ? formatCurrencySafe(s.fees) : "—",
        formatDateSafe(s.createdAt),
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [
          ["Type", "Allocated", "Used", "Remaining", "Rate", "Fees", "Created"],
        ],
        body: sourceData,
        theme: "striped",
        headStyles: {
          fillColor: colors.primary,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 9,
          cellPadding: 4,
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 3,
          textColor: colors.text,
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
        columnStyles: {
          0: { halign: "left" },
          1: { halign: "right" },
          2: { halign: "right" },
          3: { halign: "right" },
          4: { halign: "center" },
          5: { halign: "right" },
          6: { halign: "right" },
        },
        margin: { left: 15, right: 15 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    } else {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colors.lightText);
      doc.text("No financing sources available.", 15, yPos + 10);
      yPos += 20;
    }

    // ===== DRAWDOWN HISTORY TABLE (SIMPLIFIED - NO RECORDED ON) =====
    if (drawdowns.length > 0) {
      // Check if we need a new page
      if (yPos > pageHeight - 80) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.primary);
      doc.text("DRAWDOWN HISTORY", 15, yPos);

      yPos += 5;

      const drawdownData = drawdowns.map((d) => [
        d.source?.type || "N/A",
        formatDateSafe(d.date),
        formatCurrencySafe(d.amount),
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["Source Type", "Drawdown Date", "Amount"]],
        body: drawdownData,
        theme: "striped",

        // ADD THESE LINES FOR STRAIGHT BORDERS
        tableLineWidth: 0.1,
        tableLineColor: [0, 0, 0],
        styles: {
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
        },

        headStyles: {
          fillColor: colors.secondary,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 9,
          cellPadding: 5,
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 2,
          textColor: colors.text,
        },
        alternateRowStyles: {
          fillColor: [239, 246, 255],
        },
        columnStyles: {
          0: { halign: "left" },
          1: { halign: "center" },
          2: { halign: "right" },
        },
        margin: { left: 15, right: 5 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // ===== FOOTER =====
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.5);
    doc.line(15, pageHeight - 25, pageWidth - 15, pageHeight - 25);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.lightText);
    doc.text(
      "This is an automatically generated financing report from Film Finance Management System.",
      pageWidth / 2,
      pageHeight - 18,
      { align: "center" }
    );

    doc.setFontSize(7);
    doc.text(
      `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
      pageWidth / 2,
      pageHeight - 12,
      { align: "center" }
    );

    doc.save(
      `FinancingSources-${projectTitle.replace(/\s+/g, "-")}-${Date.now()}.pdf`
    );
    alert("✅ Financing report PDF generated successfully!");
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("❌ Failed to generate PDF. Please try again.");
  }
};

export default function FinancingSourcesPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [sources, setSources] = useState<FinancingSource[]>([]);
  const [drawdowns, setDrawdowns] = useState<Drawdown[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [showDrawdownModal, setShowDrawdownModal] = useState(false);

  const [sourceFormData, setSourceFormData] = useState<SourceFormData>({
    type: "EQUITY",
    amount: 0,
    rate: 0,
    fees: 0,
  });

  const [drawdownFormData, setDrawdownFormData] = useState<DrawdownFormData>({
    sourceId: "",
    date: new Date().toISOString().split("T")[0] as string,
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
      const response = await fetch(`${APIBASEURL}/projects?limit=100`, {
        credentials: "include",
      });
      const result = await response.json();
      if (result.success) {
        setProjects(result.data.projects);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchFinancingSources = async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${APIBASEURL}/projects/${selectedProjectId}/financing-sources`,
        { credentials: "include" }
      );
      const result = await response.json();
      if (result.success) {
        const manualSources = result.data.filter(
          (s: FinancingSource) => !s.sourceQuotationId
        );
        setSources(manualSources);
      }
    } catch (error) {
      console.error("Error fetching sources:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrawdowns = async () => {
    if (!selectedProjectId) return;
    try {
      const response = await fetch(
        `${APIBASEURL}/projects/${selectedProjectId}/drawdowns`,
        { credentials: "include" }
      );
      const result = await response.json();
      if (result.success) {
        setDrawdowns(result.data);
      }
    } catch (error) {
      console.error("Error fetching drawdowns:", error);
    }
  };

  const handleCreateSource = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProjectId) return;

    try {
      const response = await fetch(
        `${APIBASEURL}/projects/${selectedProjectId}/financing-sources`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(sourceFormData),
        }
      );
      const result = await response.json();
      if (result.success) {
        alert("✅ Financing source created");
        setShowSourceModal(false);
        setSourceFormData({ type: "EQUITY", amount: 0, rate: 0, fees: 0 });
        fetchFinancingSources();
      } else {
        alert(result.message || "Failed to create source");
      }
    } catch (error) {
      console.error("Error creating source:", error);
      alert("Failed to create source");
    }
  };

  const handleCreateDrawdown = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProjectId) return;

    try {
      const response = await fetch(
        `${APIBASEURL}/projects/${selectedProjectId}/drawdowns`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(drawdownFormData),
        }
      );
      const result = await response.json();
      if (result.success) {
        alert("✅ Drawdown created");
        setShowDrawdownModal(false);
        setDrawdownFormData({
          sourceId: "",
          date: new Date().toISOString().split("T")[0] as string,
          amount: 0,
        });
        fetchFinancingSources();
        fetchDrawdowns();
      } else {
        alert(result.message || "Failed to create drawdown");
      }
    } catch (error) {
      console.error("Error creating drawdown:", error);
      alert("Failed to create drawdown");
    }
  };

  const handleDeleteSource = async (id: string) => {
    if (!confirm("Delete this financing source?")) return;
    if (!selectedProjectId) return;

    try {
      const response = await fetch(
        `${APIBASEURL}/projects/${selectedProjectId}/financing-sources/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      const result = await response.json();
      if (result.success) {
        alert("✅ Source deleted");
        fetchFinancingSources();
      } else {
        alert(result.message || "Failed to delete");
      }
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Failed to delete");
    }
  };

  const handleDeleteDrawdown = async (id: string) => {
    if (!confirm("Delete this drawdown?")) return;
    if (!selectedProjectId) return;

    try {
      const response = await fetch(
        `${APIBASEURL}/projects/${selectedProjectId}/drawdowns/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      const result = await response.json();
      if (result.success) {
        alert("✅ Drawdown deleted");
        fetchFinancingSources();
        fetchDrawdowns();
      } else {
        alert(result.message || "Failed to delete");
      }
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Failed to delete");
    }
  };

  const formatCurrency = (amount: number) => {
    const project = projects.find((p) => p.id === selectedProjectId);
    const currency = project?.baseCurrency || "USD";
    return `${currency} ${amount.toLocaleString()}`;
  };

  const handleProjectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedProjectId(e.target.value);
  };

  const handleSourceFormChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "amount" || name === "rate" || name === "fees") {
      setSourceFormData((prev) => ({ ...prev, [name]: Number(value) }));
    } else {
      setSourceFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDrawdownFormChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "amount") {
      setDrawdownFormData((prev) => ({ ...prev, [name]: Number(value) }));
    } else {
      setDrawdownFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDownloadPDF = () => {
    const project = projects.find((p) => p.id === selectedProjectId);
    if (!project) return;
    exportFinancingToPDF(
      sources,
      drawdowns,
      project.title,
      project.baseCurrency
    );
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const totalFinancing = sources.reduce((sum, s) => sum + s.amount, 0);
  const totalDrawn = sources.reduce((sum, s) => sum + s.totalDrawn, 0);
  const totalRemaining = sources.reduce((sum, s) => sum + s.remaining, 0);

  // Calculate percentages for visual graph
  const usedPercentage =
    totalFinancing > 0 ? (totalDrawn / totalFinancing) * 100 : 0;
  const remainingPercentage =
    totalFinancing > 0 ? (totalRemaining / totalFinancing) * 100 : 0;

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
                Manage equity, loans, grants, and investor capital
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
                Add Source
              </button>
              <button
                type="button"
                onClick={() => setShowDrawdownModal(true)}
                className="inline-flex items-center gap-2 px-4 h-11 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm"
              >
                <TrendingUp className="w-4 h-4" />
                Record Drawdown
              </button>
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="inline-flex items-center gap-2 px-4 h-11 rounded-lg border-2 border-green-400 bg-green-50 text-green-700 text-sm font-semibold hover:bg-green-100 shadow-sm"
                disabled={sources.length === 0}
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            </>
          )}
        </div>

        {/* Summary Cards & Visual Graph */}
        {selectedProjectId && sources.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
                <div className="text-xs text-slate-500 mb-1">
                  Total Allocated
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {formatCurrency(totalFinancing)}
                </div>
              </div>
              <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
                <div className="text-xs text-slate-500 mb-1">Total Used</div>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalDrawn)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {usedPercentage.toFixed(1)}% of total
                </div>
              </div>
              <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
                <div className="text-xs text-slate-500 mb-1">Remaining</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalRemaining)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {remainingPercentage.toFixed(1)}% available
                </div>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Financing Utilization
              </h3>
              <div className="w-full h-12 bg-slate-100 rounded-lg overflow-hidden flex">
                <div
                  className="bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-white text-sm font-semibold transition-all duration-500"
                  style={{ width: `${usedPercentage}%` }}
                >
                  {usedPercentage > 10 && `${usedPercentage.toFixed(1)}% Used`}
                </div>
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center text-white text-sm font-semibold transition-all duration-500"
                  style={{ width: `${remainingPercentage}%` }}
                >
                  {remainingPercentage > 10 &&
                    `${remainingPercentage.toFixed(1)}% Remaining`}
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-slate-600">
                    Used: {formatCurrency(totalDrawn)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-slate-600">
                    Remaining: {formatCurrency(totalRemaining)}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Financing Sources Table */}
        {selectedProjectId && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <PiggyBank className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-slate-900">
                Financing Sources ({sources.length})
              </h2>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : sources.length === 0 ? (
              <div className="text-center p-10 bg-white/80 rounded-2xl border border-slate-200">
                <PiggyBank className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-lg font-medium text-slate-900 mb-1">
                  No financing sources yet
                </p>
                <p className="text-sm text-slate-600">
                  Add a financing source to get started.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                        Type
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">
                        Allocated
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">
                        Used
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">
                        Remaining
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                        Rate
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                        Fees
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                        Created
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {sources.map((source) => {
                      const sourceUsedPct =
                        (source.totalDrawn / source.amount) * 100;
                      return (
                        <tr
                          key={source.id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900">
                              {source.type}
                            </div>
                            <div className="text-xs text-slate-500">
                              {sourceUsedPct.toFixed(1)}% utilized
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">
                            {formatCurrency(source.amount)}
                          </td>
                          <td className="px-4 py-3 text-right text-red-600 font-semibold">
                            {formatCurrency(source.totalDrawn)}
                          </td>
                          <td className="px-4 py-3 text-right text-green-600 font-semibold">
                            {formatCurrency(source.remaining)}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {source.rate ? `${source.rate}%` : "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {source.fees ? formatCurrency(source.fees) : "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">
                            {new Date(source.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleDeleteSource(source.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Source"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Drawdowns Table */}
        {selectedProjectId && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">
                Drawdown History ({drawdowns.length})
              </h2>
            </div>
            {drawdowns.length === 0 ? (
              <div className="text-center p-10 bg-white/80 rounded-2xl border border-slate-200">
                <TrendingUp className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-lg font-medium text-slate-900 mb-1">
                  No drawdowns recorded yet
                </p>
                <p className="text-sm text-slate-600">
                  Record a drawdown to track fund utilization.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full text-sm border border-slate-300">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase border border-slate-300">
                        Source Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase border border-slate-300">
                        Drawdown Date
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase border border-slate-300">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase border border-slate-300">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {drawdowns.map((drawdown) => (
                      <tr
                        key={drawdown.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-4 py-3 font-semibold text-slate-900 border border-slate-300">
                          {drawdown.source?.type || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-slate-700 border border-slate-300">
                          {new Date(drawdown.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-blue-600 border border-slate-300">
                          {formatCurrency(drawdown.amount)}
                        </td>
                        <td className="px-4 py-3 border border-slate-300">
                          <button
                            onClick={() => handleDeleteDrawdown(drawdown.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Drawdown"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Source Modal */}
        {showSourceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <h2 className="text-xl font-bold mb-4 text-slate-900">
                Add Financing Source
              </h2>
              <form onSubmit={handleCreateSource} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
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
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
                    Total Amount *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={sourceFormData.amount}
                    onChange={handleSourceFormChange}
                    min="0"
                    step="0.01"
                    required
                    className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
                    Interest Rate % (Optional)
                  </label>
                  <input
                    type="number"
                    name="rate"
                    value={sourceFormData.rate}
                    onChange={handleSourceFormChange}
                    min="0"
                    step="0.01"
                    className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
                    Fees (Optional)
                  </label>
                  <input
                    type="number"
                    name="fees"
                    value={sourceFormData.fees}
                    onChange={handleSourceFormChange}
                    min="0"
                    step="0.01"
                    className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSourceModal(false)}
                    className="px-4 h-10 rounded-lg border border-slate-300 text-sm hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 h-10 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <h2 className="text-xl font-bold mb-4 text-slate-900">
                Record Drawdown
              </h2>
              <form onSubmit={handleCreateDrawdown} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
                    Financing Source *
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
                        {source.type} - {formatCurrency(source.amount)}{" "}
                        (Available: {formatCurrency(source.remaining)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
                    Drawdown Date *
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
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
                    Amount *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={drawdownFormData.amount}
                    onChange={handleDrawdownFormChange}
                    min="0"
                    step="0.01"
                    required
                    className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDrawdownModal(false)}
                    className="px-4 h-10 rounded-lg border border-slate-300 text-sm hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 h-10 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                  >
                    Record
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
