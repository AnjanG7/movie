"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export interface Project {
  id: string;
  title: string;
  baseCurrency: string;
}

export interface BudgetLine {
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

export interface BudgetVersion {
  id: string;
  version: string;
  type: string;
  grandTotal: number;
  createdAt: string;
  updatedAt: string;
  lockedAt?: string;
  lines: BudgetLine[];
}

export interface LineFormData {
  phase: string;
  department: string;
  name: string;
  qty: number;
  rate: number;
  taxPercent: number;
  vendor: string;
  notes: string;
}
export function useBudgetService() {
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

  return {
    projects,
    selectedProjectId,
    handleProjectChange,
    budgetVersions,
    selectedVersion,
    handleVersionChange,
    loading,
    showAddLineModal,
    setShowAddLineModal,
    editingLine,
    setEditingLine,
    lineFormData,
    handleLineFieldChange,
    handleAddLine,
    handleEditLine,
    handleDeleteLine,
    formatCurrency,
    formatDate,
    calculateLineTotal,
    calculateTotalsByPhase,
    calculateGrandTotal,
    exportToPDF,
    selectedProject,
  };
}
