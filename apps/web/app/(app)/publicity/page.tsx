"use client";

import { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  getPublicityBudgets,
  getPublicityBudgetLines,
  getPublicitySummary,
  updateROIWithPublicity,
  createPublicityBudget,
  updatePublicityBudget,
  deletePublicityBudget,
  getCampaignCalendar,
  createCampaignEvent,    // Add these three
  updateCampaignEvent,
  deleteCampaignEvent,
} from "../lib/api/publicity";
import {
  Film,
  TrendingUp,
  DollarSign,
  Calendar,
  X,
  Plus,
  Download,
  Megaphone,
  Edit,
  Trash2,
  AlertCircle,
} from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://film-finance-app.onrender.com/api";

interface Project {
  id: string;
  title: string;
  baseCurrency: string;
  status?: string;
}

interface PublicityBudget {
  id: string;
  name: string;
  category: string;
  budgetAmount: number;
  actualAmount: number;
  vendor?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  notes?: string;
}

interface BudgetLine {
  id: string;
  name: string;
  department: string;
  qty: number;
  rate: number;
  taxPercent: number;
  vendor?: string;
  budgeted?: number;
  committed?: number;
  spent?: number;
  actualAmount?: number;
  remaining?: number;
  variance?: number;
}

interface PublicitySummary {
  summary: {
    totalBudget: number;
    totalActual: number;
    totalVariance: number;
    percentSpent: number;
    itemCount: number;
    upcomingEvents: number;
    completedEvents: number;
    inProgressEvents: number;
    totalEvents: number;
  };
  byCategory: Array<{
    category: string;
    budgeted: number;
    actual: number;
    variance: number;
    count: number;
  }>;
  byStatus: Array<{
    status: string;
    budgeted: number;
    actual: number;
    count: number;
  }>;
}

interface CampaignEvent {
  id: string;
  title: string;
  eventType: string;
  startDate: string;
  endDate?: string;
  status: string;
  description?: string;   
  deliverable?: string;
  notes?: string;
  publicityBudgetId?: string;
  publicityBudget?: {
    id: string;
    name: string;
    category: string;
    budgetAmount: number;
  };

}

export default function PublicityPage() {
  // Project Selection
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<"budgets" | "budget-lines" | "calendar">("budgets");

  // State
  const [budgets, setBudgets] = useState<PublicityBudget[]>([]);
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  const [summary, setSummary] = useState<PublicitySummary | null>(null);
  const [campaignEvents, setCampaignEvents] = useState<CampaignEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<PublicityBudget | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form data
  const [budgetFormData, setBudgetFormData] = useState({
    name: "",
    category: "TRAILER",
    description: "",
    budgetAmount: "",
    actualAmount: "",
    vendor: "",
    startDate: "",
    endDate: "",
    status: "PLANNED",
    notes: "",
  });
// Campaign Event Modal states
const [showEventModal, setShowEventModal] = useState(false);
const [editingEvent, setEditingEvent] = useState<CampaignEvent | null>(null);

// Campaign Event Form data
const [eventFormData, setEventFormData] = useState({
  title: "",
  description: "",
  eventType: "PREMIERE",
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
    if (selectedProject) {
      fetchAllData();
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/projects?limit=999`, {
        credentials: "include",
      });
      const json = await res.json();

      if (json?.success) {
        setProjects(json.data.projects);

        const params = new URLSearchParams(window.location.search);
        const projectId = params.get("projectId");
        if (projectId) {
          const project = json.data.projects.find((p: Project) => p.id === projectId);
          if (project) setSelectedProject(project);
        }
      }
    } catch (error) {
      console.error("Failed to fetch projects", error);
      setError("Failed to load projects");
    }
  };

  const fetchAllData = async () => {
    if (!selectedProject) return;

    try {
      setLoading(true);
      setError(null);

      const [budgetsRes, budgetLinesRes, summaryRes, calendarRes] = await Promise.all([
        getPublicityBudgets(selectedProject.id),
        getPublicityBudgetLines(selectedProject.id),
        getPublicitySummary(selectedProject.id),
        getCampaignCalendar(selectedProject.id),
      ]);

      // Handle budgets response
      if (budgetsRes.success) {
        const budgetsData = budgetsRes.data.budgets || [];
        // Calculate progress for each budget
        const budgetsWithProgress = budgetsData.map((budget: PublicityBudget) => ({
          ...budget,
          progress: budget.budgetAmount > 0 
            ? (budget.actualAmount / budget.budgetAmount) * 100 
            : 0
        }));
        setBudgets(budgetsWithProgress);
      } else {
        throw new Error(budgetsRes.message || "Failed to fetch budgets");
      }

      // Handle budget lines response
      if (budgetLinesRes.success) {
        setBudgetLines(budgetLinesRes.data.lines || []);
      } else {
        console.warn("Budget lines fetch failed:", budgetLinesRes.message);
        setBudgetLines([]);
      }

      // Handle summary response
      if (summaryRes.success) {
        setSummary(summaryRes.data);
      } else {
        console.warn("Summary fetch failed:", summaryRes.message);
      }

      // Handle calendar response
      if (calendarRes.success) {
        setCampaignEvents(calendarRes.data || []);
      } else {
        console.warn("Calendar fetch failed:", calendarRes.message);
        setCampaignEvents([]);
      }
    } catch (err: any) {
      console.error("Error fetching publicity data", err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return "0.0";
    }
    return value.toFixed(1);
  };

  const formatCurrency = (amount: number | null | undefined) => {
    const currency = selectedProject?.baseCurrency || "USD";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount || 0);
  };

  // Handle budget create/update
  const handleBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    try {
      setSubmitting(true);
      const data = {
        name: budgetFormData.name,
        category: budgetFormData.category,
        description: budgetFormData.description,
        budgetAmount: parseFloat(budgetFormData.budgetAmount),
        actualAmount: parseFloat(budgetFormData.actualAmount) || 0,
        vendor: budgetFormData.vendor || undefined,
        startDate: budgetFormData.startDate || undefined,
        endDate: budgetFormData.endDate || undefined,
        status: budgetFormData.status,
        notes: budgetFormData.notes || undefined,
      };

      let result;
      if (editingBudget) {
        result = await updatePublicityBudget(selectedProject.id, editingBudget.id, data);
      } else {
        result = await createPublicityBudget(selectedProject.id, data);
      }

      if (!result.success) {
        throw new Error(result.message || "Failed to save budget");
      }

      setShowBudgetModal(false);
      resetBudgetForm();
      fetchAllData();
    } catch (err: any) {
      console.error("Error saving budget", err);
      alert(err.message || "Failed to save budget");
    } finally {
      setSubmitting(false);
    }
  };

  const resetBudgetForm = () => {
    setBudgetFormData({
      name: "",
      category: "TRAILER",
      description: "",
      budgetAmount: "",
      actualAmount: "",
      vendor: "",
      startDate: "",
      endDate: "",
      status: "PLANNED",
      notes: "",
    });
    setEditingBudget(null);
  };

  // Handle budget deletion
  const handleDeleteBudget = async (budgetId: string) => {
    if (!selectedProject) return;
    
    if (!confirm("Are you sure you want to delete this budget? This action cannot be undone.")) {
      return;
    }

    try {
      const result = await deletePublicityBudget(selectedProject.id, budgetId);
      if (!result.success) {
        throw new Error(result.message || "Failed to delete budget");
      }
      fetchAllData();
    } catch (err: any) {
      console.error("Error deleting budget", err);
      alert(err.message || "Failed to delete budget");
    }
  };
// Reset event form
const resetEventForm = () => {
  setEventFormData({
    title: "",
    description: "",
    eventType: "PREMIERE",
    startDate: "",
    endDate: "",
    deliverable: "",
    publicityBudgetId: "",
    status: "UPCOMING",
    notes: "",
  });
  setEditingEvent(null);
};

// Handle event create/update
const handleEventSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!selectedProject) return;

  try {
    setSubmitting(true);
    const data = {
      title: eventFormData.title,
      description: eventFormData.description || undefined,
      eventType: eventFormData.eventType,
      startDate: eventFormData.startDate,
      endDate: eventFormData.endDate || undefined,
      deliverable: eventFormData.deliverable || undefined,
      publicityBudgetId: eventFormData.publicityBudgetId || undefined,
      status: eventFormData.status,
      notes: eventFormData.notes || undefined,
    };

    let result;
    if (editingEvent) {
      result = await updateCampaignEvent(selectedProject.id, editingEvent.id, data);
    } else {
      result = await createCampaignEvent(selectedProject.id, data);
    }

    if (!result.success) {
      throw new Error(result.message || "Failed to save campaign event");
    }

    setShowEventModal(false);
    resetEventForm();
    fetchAllData();
  } catch (err: any) {
    console.error("Error saving campaign event", err);
    alert(err.message || "Failed to save campaign event");
  } finally {
    setSubmitting(false);
  }
};

// Handle event deletion
const handleDeleteEvent = async (eventId: string) => {
  if (!selectedProject) return;
  
  if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
    return;
  }

  try {
    const result = await deleteCampaignEvent(selectedProject.id, eventId);
    if (!result.success) {
      throw new Error(result.message || "Failed to delete event");
    }
    fetchAllData();
  } catch (err: any) {
    console.error("Error deleting event", err);
    alert(err.message || "Failed to delete event");
  }
};

  // Export PDF
  const exportPublicityToPDF = () => {
    if (!selectedProject) {
      alert("Please select a project first");
      return;
    }

    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.text("Publicity & Marketing Report", 14, 20);
    doc.setFontSize(11);
    doc.text(`Project: ${selectedProject.title}`, 14, 30);
    doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 14, 36);

    // Summary Section
    if (summary) {
      doc.setFillColor(240, 240, 240);
      doc.rect(14, 45, 180, 40, "F");
      doc.setFontSize(10);
      doc.text("Financial Summary", 16, 52);
      doc.text(`Total Budget: ${formatCurrency(summary.summary.totalBudget)}`, 16, 59);
      doc.text(`Total Spent: ${formatCurrency(summary.summary.totalActual)}`, 16, 66);
      doc.text(`Remaining: ${formatCurrency(summary.summary.totalVariance)}`, 16, 73);
      doc.text(`Completion: ${formatPercentage(summary.summary.percentSpent)}%`, 120, 59);
      doc.text(`Total Events: ${summary.summary.totalEvents}`, 120, 66);
    }

    // Budgets Table
    if (budgets?.length) {
      const startY = summary ? 95 : 50;
      doc.setFontSize(14);
      doc.text("Publicity Budgets", 14, startY);

      const budgetBody: string[][] = budgets.map((b) => [
        b.name || "N/A",
        b.category || "-",
        b.status?.replace("_", " ") || "N/A",
        formatCurrency(b.budgetAmount),
        formatCurrency(b.actualAmount),
        `${formatPercentage((b.actualAmount / b.budgetAmount) * 100)}%`,
      ]);

      autoTable(doc, {
        startY: startY + 5,
        head: [["Name", "Category", "Status", "Budget", "Actual", "Progress"]],
        body: budgetBody,
        theme: "striped",
        headStyles: { fillColor: [168, 85, 247] },
        columnStyles: {
          3: { halign: "right" },
          4: { halign: "right" },
          5: { halign: "right" },
        },
      });
    }

    const filename = `Publicity_${selectedProject.title.replace(/\s+/g, "_")}_${
      new Date().toISOString().split("T")[0]
    }.pdf`;
    doc.save(filename);
  };

  // Handle ROI update
  const handleUpdateROI = async () => {
    if (!selectedProject) return;

    try {
      setSubmitting(true);
      const response = await updateROIWithPublicity(selectedProject.id);

      if (response.success) {
        alert("Spent updated successfully!");
        console.log("Updated metrics:", response.data);
      } else {
        throw new Error(response.message || "Failed to update Spent");
      }
    } catch (err: any) {
      console.error("Error updating Spent", err);
      alert(err.message || "Failed to update Spent");
    } finally {
      setSubmitting(false);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-red-500";
    if (progress >= 75) return "bg-orange-500";
    if (progress >= 50) return "bg-yellow-500";
    if (progress >= 25) return "bg-blue-500";
    return "bg-green-500";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-700";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-700";
      case "CANCELLED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-purple-100 rounded-lg">
            <Megaphone className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Publicity & Marketing</h1>
            <p className="text-gray-600">Manage publicity budgets, campaigns, and expenses</p>
          </div>
        </div>
      </div>

      {/* Project Selector */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Select Project</label>
        <select
          value={selectedProject?.id || ""}
          onChange={(e) => {
            const project = projects.find((p) => p.id === e.target.value) || null;
            setSelectedProject(project);
          }}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">-- Select Project --</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.title} ({project.baseCurrency})
            </option>
          ))}
        </select>
      </div>

      {/* Show content only if project is selected */}
      {!selectedProject ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Film className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Project Selected</h3>
          <p className="text-gray-600">Please select a project to manage publicity</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">Error loading data</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <button
              onClick={fetchAllData}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mb-6">
            <button
              onClick={exportPublicityToPDF}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </button>
            <button
              onClick={handleUpdateROI}
              disabled={submitting}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <TrendingUp className="w-5 h-5" />
              {submitting ? "Updating..." : "Update Spent"}
            </button>
          </div>

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
                  <div className="p-2 bg-red-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-red-600" />
                  </div>
                  <p className="text-sm text-gray-600">Total Spent</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.summary.totalActual)}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600">Remaining</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.summary.totalVariance)}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-sm text-gray-600">Spent %</p>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {formatPercentage(summary.summary.percentSpent)}%
                </p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                {[
                  { key: "budgets", label: `Budgets (${budgets.length})` },
                  { key: "budget-lines", label: `Budget Lines (${budgetLines.length})` },
                  { key: "calendar", label: `Calendar (${campaignEvents.length})` },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.key
                        ? "border-purple-600 text-purple-600"
                        : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === "budgets" && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Publicity Budgets</h2>
                    <button
                      onClick={() => {
                        resetBudgetForm();
                        setShowBudgetModal(true);
                      }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Add Budget
                    </button>
                  </div>

                  {budgets.length === 0 ? (
                    <div className="text-center py-12">
                      <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No publicity budgets yet</p>
                      <button
                        onClick={() => setShowBudgetModal(true)}
                        className="mt-4 text-purple-600 hover:text-purple-700 text-sm font-medium"
                      >
                        Create your first budget
                      </button>
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Progress
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {budgets.map((budget) => {
                            const progress = budget.budgetAmount > 0 
                              ? (budget.actualAmount / budget.budgetAmount) * 100 
                              : 0;
                            
                            return (
                              <tr key={budget.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                  {budget.name}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                  {budget.category.replace(/_/g, " ")}
                                </td>
                                <td className="px-6 py-4 text-sm">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                      budget.status
                                    )}`}
                                  >
                                    {budget.status.replace(/_/g, " ")}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-right text-gray-900">
                                  {formatCurrency(budget.budgetAmount)}
                                </td>
                                <td className="px-6 py-4 text-sm text-right text-gray-900">
                                  {formatCurrency(budget.actualAmount)}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                      <div
                                        className={`h-2 rounded-full ${getProgressColor(progress)}`}
                                        style={{ width: `${Math.min(progress, 100)}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-xs text-gray-600 w-10 text-right">
                                      {formatPercentage(progress)}%
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => {
                                        setEditingBudget(budget);
                                        setBudgetFormData({
                                          name: budget.name,
                                          category: budget.category,
                                          description: budget.description || "",
                                          budgetAmount: budget.budgetAmount.toString(),
                                          actualAmount: (budget.actualAmount || 0).toString(),
                                          vendor: budget.vendor || "",
                                          startDate: budget.startDate?.split("T")[0] || "",
                                          endDate: budget.endDate?.split("T")[0] || "",
                                          status: budget.status,
                                          notes: budget.notes || "",
                                        });
                                        setShowBudgetModal(true);
                                      }}
                                      className="text-blue-600 hover:text-blue-800 p-1"
                                      title="Edit"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteBudget(budget.id)}
                                      className="text-red-600 hover:text-red-800 p-1"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-4 h-4" />
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
              )}

  {activeTab === "budget-lines" && (
  <div>
    <h2 className="text-lg font-semibold mb-4">Budget Lines</h2>
    
    {/* Summary Card - Shows Total Budget vs Budget Lines */}
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Total Budget Lines</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(
              budgetLines.reduce((sum, line) => {
                const lineTotal = line.budgeted || (line.qty * line.rate * (1 + (line.taxPercent || 0) / 100));
                return sum + lineTotal;
              }, 0)
            )}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Total Publicity Budget (Planned)</p>
          <p className="text-2xl font-bold text-purple-600">
            {formatCurrency(summary?.summary.totalBudget || 0)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Spent % of Budget</p>
          <p className="text-2xl font-bold text-green-600">
            {(() => {
              const totalBudgetLines = budgetLines.reduce((sum, line) => {
                const lineTotal = line.budgeted || (line.qty * line.rate * (1 + (line.taxPercent || 0) / 100));
                return sum + lineTotal;
              }, 0);
              const plannedBudget = summary?.summary.totalBudget || 0;
              const spentPercent = plannedBudget > 0 ? (plannedBudget / totalBudgetLines ) * 100 : 0;
              return formatPercentage(spentPercent);
            })()}%
          </p>
          <div className="mt-2 bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getProgressColor(
                (() => {
                  const totalBudgetLines = budgetLines.reduce((sum, line) => {
                    const lineTotal = line.budgeted || (line.qty * line.rate * (1 + (line.taxPercent || 0) / 100));
                    return sum + lineTotal;
                  }, 0);
                  const plannedBudget = summary?.summary.totalBudget || 0;
                  return plannedBudget > 0 ? (totalBudgetLines / plannedBudget) * 100 : 0;
                })()
              )}`}
              style={{
                width: `${Math.min(
                  (() => {
                    const totalBudgetLines = budgetLines.reduce((sum, line) => {
                      const lineTotal = line.budgeted || (line.qty * line.rate * (1 + (line.taxPercent || 0) / 100));
                      return sum + lineTotal;
                    }, 0);
                    const plannedBudget = summary?.summary.totalBudget || 0;
                    return plannedBudget > 0 ? (totalBudgetLines / plannedBudget) * 100 : 0;
                  })(),
                  100
                )}%`
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>

    {budgetLines.length === 0 ? (
      <p className="text-gray-500 text-center py-12">No budget lines available</p>
    ) : (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Department
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Qty
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Rate
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {budgetLines.map((line) => {
              const total = line.budgeted || (line.qty * line.rate * (1 + (line.taxPercent || 0) / 100));
              return (
                <tr key={line.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{line.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {line.department}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-900">
                    {line.qty}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-900">
                    {formatCurrency(line.rate)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-900">
                    {formatCurrency(total)}
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



            {activeTab === "calendar" && (
  <div>
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-semibold">Campaign Calendar</h2>
      <button
        onClick={() => {
          resetEventForm();
          setShowEventModal(true);
        }}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Add Event
      </button>
    </div>

    {campaignEvents.length === 0 ? (
      <div className="text-center py-12">
        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No campaign events scheduled</p>
        <button
          onClick={() => setShowEventModal(true)}
          className="mt-4 text-purple-600 hover:text-purple-700 text-sm font-medium"
        >
          Create your first event
        </button>
      </div>
    ) : (
      <div className="space-y-4">
        {campaignEvents.map((event) => (
          <div
            key={event.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-lg">{event.title}</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    {event.eventType.replace(/_/g, " ")}
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                      event.status
                    )}`}
                  >
                    {event.status.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingEvent(event);
                    setEventFormData({
                      title: event.title,
                      description: event.description || "",
                      eventType: event.eventType,
                      startDate: event.startDate?.split("T")[0] || "",
                      endDate: event.endDate?.split("T")[0] || "",
                      deliverable: event.deliverable || "",
                      publicityBudgetId: event.publicityBudgetId || "",
                      status: event.status,
                      notes: event.notes || "",
                    });
                    setShowEventModal(true);
                  }}
                  className="text-blue-600 hover:text-blue-800 p-1"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteEvent(event.id)}
                  className="text-red-600 hover:text-red-800 p-1"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>
                  Start: {new Date(event.startDate).toLocaleDateString()}
                </span>
              </div>
              {event.endDate && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>
                    End: {new Date(event.endDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {event.description && (
              <p className="text-sm text-gray-600 mt-3 border-t pt-3">
                {event.description}
              </p>
            )}

            {event.deliverable && (
              <div className="mt-3 p-2 bg-green-50 rounded text-sm">
                <span className="font-medium text-green-800">Deliverable: </span>
                <span className="text-green-700">{event.deliverable}</span>
              </div>
            )}

            {event.publicityBudget && (
              <div className="mt-3 p-2 bg-purple-50 rounded text-sm">
                <span className="font-medium text-purple-800">Budget: </span>
                <span className="text-purple-700">
                  {event.publicityBudget.name} ({event.publicityBudget.category}) - 
                  {formatCurrency(event.publicityBudget.budgetAmount)}
                </span>
              </div>
            )}

            {event.notes && (
              <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
                <span className="font-medium">Notes: </span>
                {event.notes}
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
)}

            </div>
          </div>

          {/* Budget Modal */}
          {showBudgetModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">
                    {editingBudget ? "Edit Budget" : "Create Budget"}
                  </h2>
                  <button
                    onClick={() => {
                      setShowBudgetModal(false);
                      resetBudgetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleBudgetSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={budgetFormData.name}
                        onChange={(e) =>
                          setBudgetFormData({ ...budgetFormData, name: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Category</label>
                      <select
                        value={budgetFormData.category}
                        onChange={(e) =>
                          setBudgetFormData({ ...budgetFormData, category: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="TRAILER">Trailer</option>
                        <option value="KEY_ART">Key Art</option>
                        <option value="POSTER">Poster</option>
                        <option value="SOCIAL_MEDIA">Social Media</option>
                        <option value="PR">PR</option>
                        <option value="FESTIVALS">Festivals</option>
                        <option value="DIGITAL_MARKETING">Digital Marketing</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Budget Amount <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={budgetFormData.budgetAmount}
                        onChange={(e) =>
                          setBudgetFormData({ ...budgetFormData, budgetAmount: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Actual Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={budgetFormData.actualAmount}
                        onChange={(e) =>
                          setBudgetFormData({ ...budgetFormData, actualAmount: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Status</label>
                      <select
                        value={budgetFormData.status}
                        onChange={(e) =>
                          setBudgetFormData({ ...budgetFormData, status: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="PLANNED">Planned</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Vendor</label>
                      <input
                        type="text"
                        value={budgetFormData.vendor}
                        onChange={(e) =>
                          setBudgetFormData({ ...budgetFormData, vendor: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Start Date</label>
                      <input
                        type="date"
                        value={budgetFormData.startDate}
                        onChange={(e) =>
                          setBudgetFormData({ ...budgetFormData, startDate: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">End Date</label>
                      <input
                        type="date"
                        value={budgetFormData.endDate}
                        onChange={(e) =>
                          setBudgetFormData({ ...budgetFormData, endDate: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={budgetFormData.description}
                      onChange={(e) =>
                        setBudgetFormData({ ...budgetFormData, description: e.target.value })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Optional description..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Notes</label>
                    <textarea
                      value={budgetFormData.notes}
                      onChange={(e) =>
                        setBudgetFormData({ ...budgetFormData, notes: e.target.value })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Optional notes..."
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowBudgetModal(false);
                        resetBudgetForm();
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? "Saving..." : editingBudget ? "Update" : "Create"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
      {/* Campaign Event Modal */}
{showEventModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">
          {editingEvent ? "Edit Campaign Event" : "Create Campaign Event"}
        </h2>
        <button
          onClick={() => {
            setShowEventModal(false);
            resetEventForm();
          }}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleEventSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={eventFormData.title}
            onChange={(e) =>
              setEventFormData({ ...eventFormData, title: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Event Type <span className="text-red-500">*</span>
            </label>
            <select
              value={eventFormData.eventType}
              onChange={(e) =>
                setEventFormData({ ...eventFormData, eventType: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            >
              <option value="PREMIERE">Premiere</option>
              <option value="FESTIVAL_SCREENING">Festival Screening</option>
              <option value="PRESS_CONFERENCE">Press Conference</option>
              <option value="SOCIAL_MEDIA_CAMPAIGN">Social Media Campaign</option>
              <option value="TRAILER_LAUNCH">Trailer Launch</option>
              <option value="POSTER_RELEASE">Poster Release</option>
              <option value="INTERVIEW">Interview</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={eventFormData.status}
              onChange={(e) =>
                setEventFormData({ ...eventFormData, status: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="UPCOMING">Upcoming</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={eventFormData.startDate}
              onChange={(e) =>
                setEventFormData({ ...eventFormData, startDate: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={eventFormData.endDate}
              onChange={(e) =>
                setEventFormData({ ...eventFormData, endDate: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Link to Publicity Budget
          </label>
          <select
            value={eventFormData.publicityBudgetId}
            onChange={(e) =>
              setEventFormData({
                ...eventFormData,
                publicityBudgetId: e.target.value,
              })
            }
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">-- None --</option>
            {budgets.map((budget) => (
              <option key={budget.id} value={budget.id}>
                {budget.name} ({budget.category}) - {formatCurrency(budget.budgetAmount)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Deliverable</label>
          <input
            type="text"
            value={eventFormData.deliverable}
            onChange={(e) =>
              setEventFormData({ ...eventFormData, deliverable: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="e.g., Trailer, Poster, Press Kit"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={eventFormData.description}
            onChange={(e) =>
              setEventFormData({ ...eventFormData, description: e.target.value })
            }
            rows={3}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Event details..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            value={eventFormData.notes}
            onChange={(e) =>
              setEventFormData({ ...eventFormData, notes: e.target.value })
            }
            rows={2}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Internal notes..."
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => {
              setShowEventModal(false);
              resetEventForm();
            }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Saving..." : editingEvent ? "Update" : "Create"}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

    </div>
  );
}