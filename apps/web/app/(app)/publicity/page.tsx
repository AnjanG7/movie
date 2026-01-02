"use client";

import { useState, useEffect } from "react";
import {
  getPublicityBudgets,
  createPublicityBudget,
  updatePublicityBudget,
  deletePublicityBudget,
  addPublicityExpense,
  deletePublicityExpense,
  getCampaignCalendar,
  createCampaignEvent,
  updateCampaignEvent,
  deleteCampaignEvent,
  getPublicitySummary,
  updateROIWithPublicity,
} from "../lib/api/publicity";
import type {
  PublicityBudget,
  PublicityExpense,
  CampaignEvent,
  PublicitySummary,
  PublicityCategory,
  PublicityStatus,
  CampaignEventType,
  CampaignStatus,
} from "../lib/types/publicity";
import {
  Megaphone,
  DollarSign,
  Calendar,
  TrendingUp,
  Plus,
  X,
  Edit2,
  Trash2,
  Film,
  BarChart3,
  Download,
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://film-finance-app.onrender.com/api";

interface Project {
  id: string;
  title: string;
  baseCurrency: string;
}

export default function PublicityPage() {
  // Projects list
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  // State
  const [activeTab, setActiveTab] = useState<"budget" | "calendar" | "summary">(
    "budget"
  );
  const [budgets, setBudgets] = useState<PublicityBudget[]>([]);
  const [campaignEvents, setCampaignEvents] = useState<CampaignEvent[]>([]);
  const [summary, setSummary] = useState<PublicitySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<PublicityBudget | null>(
    null
  );
  const [editingCampaign, setEditingCampaign] = useState<CampaignEvent | null>(
    null
  );
  const [selectedBudgetForExpense, setSelectedBudgetForExpense] = useState<
    string | null
  >(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [budgetFormData, setBudgetFormData] = useState<{
    name: string;
    category: PublicityCategory;
    description: string;
    budgetAmount: string;
    vendor: string;
    startDate: string;
    endDate: string;
    status: PublicityStatus;
    notes: string;
  }>({
    name: "",
    category: "TRAILER",
    description: "",
    budgetAmount: "",
    vendor: "",
    startDate: "",
    endDate: "",
    status: "PLANNED",
    notes: "",
  });

  const [expenseFormData, setExpenseFormData] = useState<{
    description: string;
    amount: string;
    expenseDate: string;
    vendor: string;
    invoiceNumber: string;
    notes: string;
  }>({
    description: "",
    amount: "",
    expenseDate: "",
    vendor: "",
    invoiceNumber: "",
    notes: "",
  });

  const [campaignFormData, setCampaignFormData] = useState<{
    title: string;
    description: string;
    eventType: CampaignEventType;
    startDate: string;
    endDate: string;
    deliverable: string;
    publicityBudgetId: string;
    status: CampaignStatus;
    notes: string;
  }>({
    title: "",
    description: "",
    eventType: "TRAILER_RELEASE",
    startDate: "",
    endDate: "",
    deliverable: "",
    publicityBudgetId: "",
    status: "UPCOMING",
    notes: "",
  });

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch data when project changes
  useEffect(() => {
    if (selectedProjectId) {
      fetchAllData();
    }
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/projects?limit=999999`, {
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
      setError("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = async () => {
    if (!selectedProjectId) return;

    try {
      setLoading(true);
      setError(null);

      const [budgetsRes, calendarRes, summaryRes] = await Promise.all([
        getPublicityBudgets(selectedProjectId),
        getCampaignCalendar(selectedProjectId),
        getPublicitySummary(selectedProjectId),
      ]);

      if (budgetsRes.success) {
        setBudgets(budgetsRes.data.budgets || []);
      }
      if (calendarRes.success) {
        setCampaignEvents(calendarRes.data || []);
      }
      if (summaryRes.success) {
        setSummary(summaryRes.data);
      }
    } catch (err: unknown) {
      console.error("Error fetching publicity data:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load data";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // HELPER FUNCTIONS
  const formatDateForInput = (dateString?: string | null): string => {
    return dateString?.split("T")[0] ?? "";
  };

  const formatCurrency = (amount: number) => {
    const project = projects.find((p) => p.id === selectedProjectId);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: project?.baseCurrency || "USD",
    }).format(amount);
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  // BUDGET FUNCTIONS
  const handleBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;

    setSubmitting(true);
    try {
      const data = {
        ...budgetFormData,
        budgetAmount: parseFloat(budgetFormData.budgetAmount),
      };

      let response;
      if (editingBudget) {
        response = await updatePublicityBudget(
          selectedProjectId,
          editingBudget.id,
          data
        );
      } else {
        response = await createPublicityBudget(selectedProjectId, data);
      }

      if (response.success) {
        alert(
          editingBudget
            ? "Budget updated successfully!"
            : "Budget created successfully!"
        );
        closeBudgetModal();
        fetchAllData();
      } else {
        throw new Error(response.message || "Failed to save budget");
      }
    } catch (err: unknown) {
      console.error("Error saving budget:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save budget";
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!confirm("Are you sure you want to delete this budget?")) return;
    if (!selectedProjectId) return;

    try {
      const response = await deletePublicityBudget(selectedProjectId, id);
      if (response.success) {
        alert("Budget deleted successfully!");
        fetchAllData();
      }
    } catch (err: unknown) {
      console.error("Error deleting budget:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete budget";
      alert(errorMessage);
    }
  };

  const openBudgetModal = (budget: PublicityBudget | null = null) => {
    if (budget) {
      setEditingBudget(budget);
      setBudgetFormData({
        name: budget.name,
        category: budget.category,
        description: budget.description || "",
        budgetAmount: budget.budgetAmount.toString(),
        vendor: budget.vendor || "",
        startDate: formatDateForInput(budget.startDate),
        endDate: formatDateForInput(budget.endDate),
        status: budget.status,
        notes: budget.notes || "",
      });
    } else {
      setEditingBudget(null);
      setBudgetFormData({
        name: "",
        category: "TRAILER",
        description: "",
        budgetAmount: "",
        vendor: "",
        startDate: "",
        endDate: "",
        status: "PLANNED",
        notes: "",
      });
    }
    setShowBudgetModal(true);
  };

  const closeBudgetModal = () => {
    setShowBudgetModal(false);
    setEditingBudget(null);
  };

  // EXPENSE FUNCTIONS
  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !selectedBudgetForExpense) return;

    setSubmitting(true);
    try {
      const data = {
        ...expenseFormData,
        amount: parseFloat(expenseFormData.amount),
      };

      const response = await addPublicityExpense(
        selectedProjectId,
        selectedBudgetForExpense,
        data
      );

      if (response.success) {
        alert("Expense added successfully!");
        closeExpenseModal();
        fetchAllData();
      } else {
        throw new Error(response.message || "Failed to add expense");
      }
    } catch (err: unknown) {
      console.error("Error adding expense:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to add expense";
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const openExpenseModal = (budgetId: string) => {
    setSelectedBudgetForExpense(budgetId);
    setExpenseFormData({
      description: "",
      amount: "",
      expenseDate: new Date().toISOString().split("T")[0] as string,
      vendor: "",
      invoiceNumber: "",
      notes: "",
    });
    setShowExpenseModal(true);
  };

  const closeExpenseModal = () => {
    setShowExpenseModal(false);
    setSelectedBudgetForExpense(null);
  };

  // CAMPAIGN FUNCTIONS
  const handleCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;

    setSubmitting(true);
    try {
      const data = {
        ...campaignFormData,
        publicityBudgetId: campaignFormData.publicityBudgetId || null,
      };

      let response;
      if (editingCampaign) {
        response = await updateCampaignEvent(
          selectedProjectId,
          editingCampaign.id,
          data
        );
      } else {
        response = await createCampaignEvent(selectedProjectId, data);
      }

      if (response.success) {
        alert(
          editingCampaign
            ? "Event updated successfully!"
            : "Event created successfully!"
        );
        closeCampaignModal();
        fetchAllData();
      } else {
        throw new Error(response.message || "Failed to save event");
      }
    } catch (err: unknown) {
      console.error("Error saving event:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save event";
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    if (!selectedProjectId) return;

    try {
      const response = await deleteCampaignEvent(selectedProjectId, id);
      if (response.success) {
        alert("Event deleted successfully!");
        fetchAllData();
      }
    } catch (err: unknown) {
      console.error("Error deleting event:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete event";
      alert(errorMessage);
    }
  };

  const openCampaignModal = (event: CampaignEvent | null = null) => {
    if (event) {
      setEditingCampaign(event);
      setCampaignFormData({
        title: event.title,
        description: event.description || "",
        eventType: event.eventType,
        startDate: formatDateForInput(event.startDate),
        endDate: formatDateForInput(event.endDate),
        deliverable: event.deliverable || "",
        publicityBudgetId: event.publicityBudgetId || "",
        status: event.status,
        notes: event.notes || "",
      });
    } else {
      setEditingCampaign(null);
      setCampaignFormData({
        title: "",
        description: "",
        eventType: "TRAILER_RELEASE",
        startDate: "",
        endDate: "",
        deliverable: "",
        publicityBudgetId: "",
        status: "UPCOMING",
        notes: "",
      });
    }
    setShowCampaignModal(true);
  };

  const closeCampaignModal = () => {
    setShowCampaignModal(false);
    setEditingCampaign(null);
  };

  // ROI UPDATE
  const handleUpdateROI = async () => {
    if (!selectedProjectId) return;

    try {
      setSubmitting(true);
      const response = await updateROIWithPublicity(selectedProjectId);
      if (response.success) {
        alert("ROI updated successfully with P&A costs!");
        console.log("Updated metrics:", response.data);
      } else {
        throw new Error(response.message || "Failed to update ROI");
      }
    } catch (err: unknown) {
      console.error("Error updating ROI:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update ROI";
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const exportToPDF = () => {
    if (!selectedProjectId || !selectedProject) {
      alert("Please select a project first");
      return;
    }

    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.text("Publicity & P&A Report", 14, 20);

    doc.setFontSize(11);
    doc.text(`Project: ${selectedProject.title}`, 14, 30);
    doc.text(`Currency: ${selectedProject.baseCurrency}`, 14, 36);
    doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 14, 42);

    // Summary Section
    if (summary) {
      doc.setFillColor(240, 240, 240);
      doc.rect(14, 50, 180, 35, "F");
      doc.setFontSize(12);
      doc.text("Summary", 16, 57);
      doc.setFontSize(10);
      doc.text(
        `Total Budget: ${formatCurrency(summary.summary.totalBudget)}`,
        16,
        64
      );
      doc.text(
        `Total Spent: ${formatCurrency(summary.summary.totalActual)}`,
        16,
        71
      );
      doc.text(
        `Variance: ${formatCurrency(Math.abs(summary.summary.totalVariance))} ${summary.summary.totalVariance < 0 ? "over" : "under"}`,
        16,
        78
      );
      doc.text(
        `Budget Used: ${summary.summary.percentSpent.toFixed(1)}%`,
        120,
        64
      );
      doc.text(`Total Items: ${summary.summary.itemCount}`, 120, 71);
      doc.text(`Total Events: ${summary.summary.totalEvents}`, 120, 78);
    }

    // Budgets Table
    let startY = 95;
    doc.setFontSize(14);
    doc.text("Publicity Budgets", 14, startY);

    const budgetData = budgets.map((budget) => [
      budget.name,
      budget.category.replace(/_/g, " "),
      budget.status.replace(/_/g, " "),
      formatCurrency(budget.budgetAmount),
      formatCurrency(budget.actualAmount),
      formatCurrency(Math.abs(budget.budgetAmount - budget.actualAmount)),
    ]);

    autoTable(doc, {
      startY: startY + 5,
      head: [["Name", "Category", "Status", "Budget", "Actual", "Remaining"]],
      body: budgetData,
      theme: "striped",
      headStyles: { fillColor: [219, 39, 119] },
      styles: { fontSize: 9 },
      columnStyles: {
        3: { halign: "right" },
        4: { halign: "right" },
        5: { halign: "right" },
      },
    });

    // Campaign Events
    if (campaignEvents.length > 0) {
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(14);
      doc.text("Campaign Calendar", 14, finalY);

      const eventData = campaignEvents.map((event) => [
        event.title,
        event.eventType.replace(/_/g, " "),
        new Date(event.startDate).toLocaleDateString(),
        event.status.replace(/_/g, " "),
      ]);

      autoTable(doc, {
        startY: finalY + 5,
        head: [["Event", "Type", "Date", "Status"]],
        body: eventData,
        theme: "striped",
        headStyles: { fillColor: [219, 39, 119] },
        styles: { fontSize: 9 },
      });
    }

    // Save
    const filename = `Publicity_${selectedProject.title}_${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(filename);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-pink-100 rounded-lg">
                <Megaphone className="w-8 h-8 text-pink-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                Publicity & P&A
              </h1>
            </div>
            <p className="text-gray-600">
              Manage marketing budget, campaign calendar, and track expenses
            </p>
          </div>
          {selectedProjectId && (
            <div className="flex items-center gap-3">
              <button
                onClick={exportToPDF}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download PDF
              </button>
              <button
                onClick={handleUpdateROI}
                disabled={submitting}
                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <TrendingUp className="w-5 h-5" />
                {submitting ? "Updating..." : "Update ROI"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Project Selector */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Select Project
        </label>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          disabled={loading}
        >
          <option value="">-- Select Project --</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.title}
            </option>
          ))}
        </select>
      </div>

      {selectedProjectId ? (
        <>
          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-600">Total Budget</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.summary.totalBudget)}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-pink-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-pink-600" />
                  </div>
                  <p className="text-sm text-gray-600">Total Spent</p>
                </div>
                <p className="text-2xl font-bold text-pink-600">
                  {formatCurrency(summary.summary.totalActual)}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-sm text-gray-600">Variance</p>
                </div>
                <p
                  className={`text-2xl font-bold ${
                    summary.summary.totalVariance < 0
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {formatCurrency(Math.abs(summary.summary.totalVariance))}
                  {summary.summary.totalVariance < 0 ? " over" : " under"}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                  </div>
                  <p className="text-sm text-gray-600">Budget Used</p>
                </div>
                <p className="text-2xl font-bold text-indigo-600">
                  {summary.summary.percentSpent.toFixed(1)}%
                </p>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
              <button
                onClick={fetchAllData}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                {[
                  { key: "budget", label: `Budgets (${budgets.length})` },
                  {
                    key: "calendar",
                    label: `Calendar (${campaignEvents.length})`,
                  },
                  { key: "summary", label: "Summary" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.key
                        ? "border-pink-600 text-pink-600"
                        : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* BUDGET TAB */}
              {activeTab === "budget" && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Publicity Budgets
                    </h3>
                    <button
                      onClick={() => openBudgetModal()}
                      className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Add Budget
                    </button>
                  </div>

                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
                    </div>
                  ) : budgets.length === 0 ? (
                    <div className="text-center py-12">
                      <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No publicity budgets yet</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Category
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Status
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                              Budget
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                              Actual
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                              Remaining
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {budgets.map((budget) => {
                            const remaining =
                              budget.budgetAmount - budget.actualAmount;
                            return (
                              <tr key={budget.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                  {budget.name}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                  {budget.category.replace(/_/g, " ")}
                                </td>
                                <td className="px-6 py-4">
                                  <span
                                    className={`px-2 py-1 text-xs font-medium rounded ${
                                      budget.status === "COMPLETED"
                                        ? "bg-green-100 text-green-800"
                                        : budget.status === "IN_PROGRESS"
                                          ? "bg-blue-100 text-blue-800"
                                          : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {budget.status.replace(/_/g, " ")}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-right text-gray-900">
                                  {formatCurrency(budget.budgetAmount)}
                                </td>
                                <td className="px-6 py-4 text-sm text-right">
                                  <span className="text-pink-600 font-medium">
                                    {formatCurrency(budget.actualAmount)}
                                  </span>
                                </td>
                                <td
                                  className={`px-6 py-4 text-sm text-right font-medium ${
                                    remaining < 0
                                      ? "text-red-600"
                                      : "text-green-600"
                                  }`}
                                >
                                  {formatCurrency(Math.abs(remaining))}
                                  {remaining < 0 && " over"}
                                </td>
                                <td className="px-6 py-4 text-right text-sm">
                                  <button
                                    onClick={() => openBudgetModal(budget)}
                                    className="text-blue-600 hover:text-blue-900 mr-3"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => openExpenseModal(budget.id)}
                                    className="text-green-600 hover:text-green-900 mr-3"
                                  >
                                    + Expense
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteBudget(budget.id)
                                    }
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Delete
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

              {/* CALENDAR TAB */}
              {activeTab === "calendar" && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Campaign Calendar
                    </h3>
                    <button
                      onClick={() => openCampaignModal()}
                      className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Add Event
                    </button>
                  </div>

                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
                    </div>
                  ) : campaignEvents.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No campaign events yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {campaignEvents.map((event) => (
                        <div
                          key={event.id}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-gray-900">
                              {event.title}
                            </h4>
                            <div className="flex gap-1">
                              <button
                                onClick={() => openCampaignModal(event)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCampaign(event.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {event.eventType.replace(/_/g, " ")}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(event.startDate).toLocaleDateString()}
                          </p>
                          <span
                            className={`mt-2 inline-block px-2 py-1 text-xs font-medium rounded ${
                              event.status === "COMPLETED"
                                ? "bg-green-100 text-green-800"
                                : event.status === "IN_PROGRESS"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {event.status.replace(/_/g, " ")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SUMMARY TAB */}
              {activeTab === "summary" && summary && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Summary
                  </h3>

                  {/* By Category */}
                  {summary.byCategory && summary.byCategory.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-md font-semibold text-gray-800 mb-3">
                        By Category
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Category
                              </th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                Budgeted
                              </th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                Actual
                              </th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                Variance
                              </th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                Count
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {summary.byCategory.map((cat: any) => (
                              <tr key={cat.category}>
                                <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                  {cat.category}
                                </td>
                                <td className="px-4 py-2 text-sm text-right">
                                  {formatCurrency(cat.budgeted)}
                                </td>
                                <td className="px-4 py-2 text-sm text-right">
                                  {formatCurrency(cat.actual)}
                                </td>
                                <td
                                  className={`px-4 py-2 text-sm text-right ${cat.variance < 0 ? "text-red-600" : "text-green-600"}`}
                                >
                                  {formatCurrency(Math.abs(cat.variance))}
                                </td>
                                <td className="px-4 py-2 text-sm text-right">
                                  {cat.count}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* By Status */}
                  {summary.byStatus && summary.byStatus.length > 0 && (
                    <div>
                      <h4 className="text-md font-semibold text-gray-800 mb-3">
                        By Status
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Status
                              </th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                Budgeted
                              </th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                Actual
                              </th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                Count
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {summary.byStatus.map((stat: any) => (
                              <tr key={stat.status}>
                                <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                  {stat.status}
                                </td>
                                <td className="px-4 py-2 text-sm text-right">
                                  {formatCurrency(stat.budgeted)}
                                </td>
                                <td className="px-4 py-2 text-sm text-right">
                                  {formatCurrency(stat.actual)}
                                </td>
                                <td className="px-4 py-2 text-sm text-right">
                                  {stat.count}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Film className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Project Selected
          </h3>
          <p className="text-gray-600">
            Please select a project to manage publicity
          </p>
        </div>
      )}

      {/* BUDGET MODAL */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingBudget ? "Edit Budget" : "Create Budget"}
                </h2>
                <button
                  onClick={closeBudgetModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleBudgetSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Campaign Name *
                  </label>
                  <input
                    type="text"
                    value={budgetFormData.name}
                    onChange={(e) =>
                      setBudgetFormData({
                        ...budgetFormData,
                        name: e.target.value,
                      })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={budgetFormData.category}
                    onChange={(e) =>
                      setBudgetFormData({
                        ...budgetFormData,
                        category: e.target.value as PublicityCategory,
                      })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="TRAILER">Trailer</option>
                    <option value="KEYART">Key Art</option>
                    <option value="POSTER">Poster</option>
                    <option value="DIGITALMARKETING">Digital Marketing</option>
                    <option value="SOCIALMEDIA">Social Media</option>
                    <option value="PR">PR</option>
                    <option value="FESTIVALS">Festivals</option>
                    <option value="SCREENINGS">Screenings</option>
                    <option value="PRINTADS">Print Ads</option>
                    <option value="OOH">Out of Home</option>
                    <option value="MEDIA">Media</option>
                    <option value="INFLUENCER">Influencer</option>
                    <option value="GRASSROOTS">Grassroots</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    value={budgetFormData.status}
                    onChange={(e) =>
                      setBudgetFormData({
                        ...budgetFormData,
                        status: e.target.value as PublicityStatus,
                      })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="PLANNED">Planned</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Budget Amount *
                  </label>
                  <input
                    type="number"
                    value={budgetFormData.budgetAmount}
                    onChange={(e) =>
                      setBudgetFormData({
                        ...budgetFormData,
                        budgetAmount: e.target.value,
                      })
                    }
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor
                  </label>
                  <input
                    type="text"
                    value={budgetFormData.vendor}
                    onChange={(e) =>
                      setBudgetFormData({
                        ...budgetFormData,
                        vendor: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={budgetFormData.startDate}
                    onChange={(e) =>
                      setBudgetFormData({
                        ...budgetFormData,
                        startDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={budgetFormData.endDate}
                    onChange={(e) =>
                      setBudgetFormData({
                        ...budgetFormData,
                        endDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={budgetFormData.description}
                    onChange={(e) =>
                      setBudgetFormData({
                        ...budgetFormData,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={budgetFormData.notes}
                    onChange={(e) =>
                      setBudgetFormData({
                        ...budgetFormData,
                        notes: e.target.value,
                      })
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeBudgetModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting
                    ? "Saving..."
                    : editingBudget
                      ? "Update Budget"
                      : "Create Budget"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXPENSE MODAL */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Add Expense
                </h2>
                <button
                  onClick={closeExpenseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleExpenseSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <input
                    type="text"
                    value={expenseFormData.description}
                    onChange={(e) =>
                      setExpenseFormData({
                        ...expenseFormData,
                        description: e.target.value,
                      })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    value={expenseFormData.amount}
                    onChange={(e) =>
                      setExpenseFormData({
                        ...expenseFormData,
                        amount: e.target.value,
                      })
                    }
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expense Date *
                  </label>
                  <input
                    type="date"
                    value={expenseFormData.expenseDate}
                    onChange={(e) =>
                      setExpenseFormData({
                        ...expenseFormData,
                        expenseDate: e.target.value,
                      })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor
                  </label>
                  <input
                    type="text"
                    value={expenseFormData.vendor}
                    onChange={(e) =>
                      setExpenseFormData({
                        ...expenseFormData,
                        vendor: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    value={expenseFormData.invoiceNumber}
                    onChange={(e) =>
                      setExpenseFormData({
                        ...expenseFormData,
                        invoiceNumber: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={expenseFormData.notes}
                    onChange={(e) =>
                      setExpenseFormData({
                        ...expenseFormData,
                        notes: e.target.value,
                      })
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeExpenseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? "Adding..." : "Add Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CAMPAIGN MODAL */}
      {showCampaignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingCampaign
                    ? "Edit Campaign Event"
                    : "Create Campaign Event"}
                </h2>
                <button
                  onClick={closeCampaignModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCampaignSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    value={campaignFormData.title}
                    onChange={(e) =>
                      setCampaignFormData({
                        ...campaignFormData,
                        title: e.target.value,
                      })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Type *
                  </label>
                  <select
                    value={campaignFormData.eventType}
                    onChange={(e) =>
                      setCampaignFormData({
                        ...campaignFormData,
                        eventType: e.target.value as CampaignEventType,
                      })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="TRAILER_RELEASE">Trailer Release</option>
                    <option value="POSTER_REVEAL">Poster Reveal</option>
                    <option value="PRESS_CONFERENCE">Press Conference</option>
                    <option value="FESTIVAL_PREMIERE">Festival Premiere</option>
                    <option value="SCREENING">Screening</option>
                    <option value="SOCIAL_CAMPAIGN">Social Campaign</option>
                    <option value="INTERVIEW">Interview</option>
                    <option value="AD_LAUNCH">Ad Launch</option>
                    <option value="PARTNERSHIP">Partnership</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    value={campaignFormData.status}
                    onChange={(e) =>
                      setCampaignFormData({
                        ...campaignFormData,
                        status: e.target.value as CampaignStatus,
                      })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="UPCOMING">Upcoming</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={campaignFormData.startDate}
                    onChange={(e) =>
                      setCampaignFormData({
                        ...campaignFormData,
                        startDate: e.target.value,
                      })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={campaignFormData.endDate}
                    onChange={(e) =>
                      setCampaignFormData({
                        ...campaignFormData,
                        endDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Related Budget
                  </label>
                  <select
                    value={campaignFormData.publicityBudgetId}
                    onChange={(e) =>
                      setCampaignFormData({
                        ...campaignFormData,
                        publicityBudgetId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="">-- No Budget --</option>
                    {budgets.map((budget) => (
                      <option key={budget.id} value={budget.id}>
                        {budget.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={campaignFormData.description}
                    onChange={(e) =>
                      setCampaignFormData({
                        ...campaignFormData,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deliverable
                  </label>
                  <input
                    type="text"
                    value={campaignFormData.deliverable}
                    onChange={(e) =>
                      setCampaignFormData({
                        ...campaignFormData,
                        deliverable: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={campaignFormData.notes}
                    onChange={(e) =>
                      setCampaignFormData({
                        ...campaignFormData,
                        notes: e.target.value,
                      })
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeCampaignModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting
                    ? "Saving..."
                    : editingCampaign
                      ? "Update Event"
                      : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
