// apps/webapp/app/publicity/page.tsx
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
  addPublicityBudgetLine,
  getCampaignCalendar,
  createCampaignEvent,
  getPublicityExpenses,
  addPublicityExpense,
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
} from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
   "https://film-finance-app.onrender.com/api";
// "http://localhost:4000/api";
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
}

interface BudgetLine {
  id: string;
  name: string;
  department: string;
  qty: number;
  rate: number;
  taxPercent: number;
  vendor?: string;
}

interface PublicitySummary {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  completionPercentage: number;
  byCategory: Record<string, any>;
  budgets: PublicityBudget[];
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
  const [campaignEvents, setCampaignEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showBudgetLineModal, setShowBudgetLineModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<PublicityBudget | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form data
  const [budgetFormData, setBudgetFormData] = useState({
    name: "",
    category: "TRAILER",
    description: "",
    budgetAmount: "",
    vendor: "",
    startDate: "",
    endDate: "",
    status: "PLANNED",
  });

  const [budgetLineFormData, setBudgetLineFormData] = useState({
    name: "",
    department: "Publicity",
    vendor: "",
    qty: 1,
    rate: "",
    taxPercent: 0,
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

      if (budgetsRes.success) setBudgets(budgetsRes.data.budgets || []);
      if (budgetLinesRes.success) setBudgetLines(budgetLinesRes.data.lines || []);
      if (summaryRes.success) setSummary(summaryRes.data);
      if (calendarRes.success) setCampaignEvents(calendarRes.data.events || []);
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
  const formatCurrency = (amount: number) => {
    const currency = selectedProject?.baseCurrency || "USD";
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  };

  // Handle budget create/update
  const handleBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    try {
      setSubmitting(true);
      const data = {
        ...budgetFormData,
        budgetAmount: parseFloat(budgetFormData.budgetAmount),
      };

      if (editingBudget) {
        await updatePublicityBudget(selectedProject.id, editingBudget.id, data);
      } else {
        await createPublicityBudget(selectedProject.id, data);
      }

      setShowBudgetModal(false);
      setBudgetFormData({
        name: "",
        category: "TRAILER",
        description: "",
        budgetAmount: "",
        vendor: "",
        startDate: "",
        endDate: "",
        status: "PLANNED",
      });
      setEditingBudget(null);
      fetchAllData();
    } catch (err: any) {
      console.error("Error saving budget", err);
      alert(err.message || "Failed to save budget");
    } finally {
      setSubmitting(false);
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
      doc.rect(14, 45, 180, 35, "F");
      doc.setFontSize(10);
      doc.text("Financial Summary", 16, 52);
      doc.text(`Total Budget: ${formatCurrency(summary.totalBudget)}`, 16, 59);
      doc.text(`Total Spent: ${formatCurrency(summary.totalSpent)}`, 16, 66);
      doc.text(`Remaining: ${formatCurrency(summary.remaining)}`, 16, 73);
      doc.text(`Completion: ${formatPercentage(summary.completionPercentage)}%`, 120, 59);
    }

    // Budgets Table
    if (budgets?.length) {
      const startY = summary ? 90 : 50;
      doc.setFontSize(14);
      doc.text("Publicity Budgets", 14, startY);

      const budgetBody: string[][] = budgets.map((b) => [
        b.name || "N/A",
        b.category || "-",
        b.status?.replace("_", " ") || "N/A",
        formatCurrency(b.budgetAmount ?? 0),
        formatCurrency(b.actualAmount ?? 0),
      ]);

      autoTable(doc, {
        startY: startY + 5,
        head: [["Name", "Category", "Status", "Budget", "Actual"]],
        body: budgetBody,
        theme: "striped",
        headStyles: { fillColor: [168, 85, 247] },
        columnStyles: {
          3: { halign: "right" },
          4: { halign: "right" },
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
        alert("ROI updated successfully!");
        console.log("Updated metrics:", response.data);
      } else {
        throw new Error(response.message || "Failed to update ROI");
      }
    } catch (err: any) {
      console.error("Error updating ROI", err);
      alert(err.message || "Failed to update ROI");
    } finally {
      setSubmitting(false);
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchAllData}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
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
              {submitting ? "Updating..." : "Update ROI"}
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
                  {formatCurrency(summary.totalBudget)}
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
                  {formatCurrency(summary.totalSpent)}
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
                  {formatCurrency(summary.remaining)}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-sm text-gray-600">Completion</p>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {formatPercentage(summary.completionPercentage)}%
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
                      onClick={() => setShowBudgetModal(true)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Add Budget
                    </button>
                  </div>

                  {budgets.length === 0 ? (
                    <div className="text-center py-12">
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
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {budgets.map((budget) => (
                            <tr key={budget.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                {budget.name}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {budget.category}
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    budget.status === "COMPLETED"
                                      ? "bg-green-100 text-green-700"
                                      : budget.status === "IN_PROGRESS"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {budget.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-right text-gray-900">
                                {formatCurrency(budget.budgetAmount)}
                              </td>
                              <td className="px-6 py-4 text-sm text-right text-gray-900">
                                {formatCurrency(budget.actualAmount)}
                              </td>
                              <td className="px-6 py-4 text-sm text-right">
                                <button
                                  onClick={() => {
                                    setEditingBudget(budget);
                                    setBudgetFormData({
                                      name: budget.name,
                                      category: budget.category,
                                      description: "",
                                      budgetAmount: budget.budgetAmount.toString(),
                                      vendor: budget.vendor || "",
                                      startDate: budget.startDate || "",
                                      endDate: budget.endDate || "",
                                      status: budget.status,
                                    });
                                    setShowBudgetModal(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 mr-3"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm("Delete this budget?")) {
                                      await deletePublicityBudget(
                                        selectedProject!.id,
                                        budget.id
                                      );
                                      fetchAllData();
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-800"
                                >
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

              {activeTab === "budget-lines" && (
                <div>
                  <h2 className="text-lg font-semibold mb-4">Budget Lines</h2>
                  {budgetLines.length === 0 ? (
                    <p className="text-gray-500">No budget lines available</p>
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
                            const total =
                              line.qty * line.rate * (1 + (line.taxPercent || 0) / 100);
                            return (
                              <tr key={line.id}>
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
                  <h2 className="text-lg font-semibold mb-4">Campaign Calendar</h2>
                  {campaignEvents.length === 0 ? (
                    <p className="text-gray-500">No campaign events scheduled</p>
                  ) : (
                    <div className="space-y-4">
                      {campaignEvents.map((event: any) => (
                        <div
                          key={event.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-gray-900">{event.title}</h3>
                              <p className="text-sm text-gray-600 mt-1">{event.eventType}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                {new Date(event.startDate).toLocaleDateString()}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                event.status === "COMPLETED"
                                  ? "bg-green-100 text-green-700"
                                  : event.status === "IN_PROGRESS"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {event.status}
                            </span>
                          </div>
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
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">
                  {editingBudget ? "Edit Budget" : "Create Budget"}
                </h2>
                <form onSubmit={handleBudgetSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <input
                      type="text"
                      value={budgetFormData.name}
                      onChange={(e) =>
                        setBudgetFormData({ ...budgetFormData, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
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
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="TRAILER">Trailer</option>
                      <option value="POSTER">Poster</option>
                      <option value="SOCIAL_MEDIA">Social Media</option>
                      <option value="PR">PR</option>
                      <option value="FESTIVALS">Festivals</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Budget Amount</label>
                    <input
                      type="number"
                      value={budgetFormData.budgetAmount}
                      onChange={(e) =>
                        setBudgetFormData({ ...budgetFormData, budgetAmount: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowBudgetModal(false);
                        setEditingBudget(null);
                      }}
                      className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
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
    </div>
  );
}
