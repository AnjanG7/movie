"use client";

import { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  getPostTasks,
  getPostBudgetLines,
  getPostProductionForecast,
  updateROIWithPostProduction,
  createPostTask,
  updatePostTask,
  deletePostTask,
  addPostBudgetLine,
} from "../lib/api/postProduction";
import {
  PostTask,
  BudgetLine,
  PostProductionForecast,
} from "../lib/types/postProduction";
import {
  Film,
  TrendingUp,
  DollarSign,
  Package,
  X,
  Plus,
  Download,
  Video,
} from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000/api";

interface Project {
  id: string;
  title: string;
  baseCurrency: string;
  status?: string;
}

export default function PostProductionPage() {
  // Project Selection
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [activeTab, setActiveTab] = useState<"tasks" | "budget" | "forecast">(
    "tasks"
  );
  const [tasks, setTasks] = useState<PostTask[]>([]);
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  const [forecast, setForecast] = useState<PostProductionForecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editingTask, setEditingTask] = useState<PostTask | null>(null);
  const [taskFormData, setTaskFormData] = useState<{
    name: string;
    type: "EDITING" | "COLOR" | "AUDIO" | "MUSIC" | "VFX" | "QC";
    costEstimate: string;
    actualCost: string;
    dueDate: string;
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
    notes: string;
    vendorId: string;
  }>({
    name: "",
    type: "EDITING",
    costEstimate: "",
    actualCost: "",
    dueDate: "",
    status: "PENDING",
    notes: "",
    vendorId: "",
  });

  const [budgetFormData, setBudgetFormData] = useState({
    name: "",
    department: "Post Production",
    vendor: "",
    qty: 1,
    rate: "",
    taxPercent: 0,
    notes: "",
  });

  const [submitting, setSubmitting] = useState(false);

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
        setProjects(json.data.projects || []);
        const params = new URLSearchParams(window.location.search);
        const projectId = params.get("projectId");
        if (projectId) {
          const project = json.data.projects.find(
            (p: Project) => p.id === projectId
          );
          if (project) {
            setSelectedProject(project); // ✅ Set the full project object
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  };

  const fetchAllData = async () => {
    if (!selectedProject) return;

    try {
      setLoading(true);
      setError(null);

      const [tasksRes, budgetRes, forecastRes] = await Promise.all([
        getPostTasks(selectedProject.id),
        getPostBudgetLines(selectedProject.id),
        getPostProductionForecast(selectedProject.id),
      ]);

      if (tasksRes.success) setTasks(tasksRes.data.postTasks || []);
      if (budgetRes.success) setBudgetLines(budgetRes.data.lines || []);
      if (forecastRes.success) setForecast(forecastRes.data);
    } catch (err: any) {
      console.error("Error fetching post-production data:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    const currency = selectedProject?.baseCurrency || "USD";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  // PDF Export Function
  const exportPostProdToPDF = () => {
    if (!selectedProject) {
      alert("Please select a project first");
      return;
    }

    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.text("Post-Production Report", 14, 20);
    doc.setFontSize(11);
    doc.text(`Project: ${selectedProject.title}`, 14, 30);
    doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 14, 36);

    // Summary Section
    if (forecast) {
      doc.setFillColor(240, 240, 240);
      doc.rect(14, 45, 180, 35, "F");
      doc.setFontSize(10);
      doc.text("Financial Summary", 16, 52);
      doc.text(
        `Total Estimated: ${formatCurrency(forecast.summary.totalEstimated)}`,
        16,
        59
      );
      doc.text(
        `Total Actual: ${formatCurrency(forecast.summary.totalActual)}`,
        16,
        66
      );
      doc.text(
        `Remaining: ${formatCurrency(forecast.summary.remaining)}`,
        16,
        73
      );
      doc.text(
        `Completion: ${forecast.summary.completionPercentage.toFixed(1)}%`,
        120,
        59
      );
      doc.text(`Total Tasks: ${forecast.tasks.total}`, 120, 66);
      doc.text(
        `Variance: ${formatCurrency(forecast.summary.variance)}`,
        120,
        73
      );
    }

    // Tasks Table
    if (tasks?.length) {
      const startY = forecast ? 90 : 50;
      doc.setFontSize(14);
      doc.text("Post-Production Tasks", 14, startY);

      const taskBody: string[][] = tasks.map((t) => [
        t.name || "N/A",
        t.type || "N/A",
        (t.status || "N/A").replace("_", " "),
        formatCurrency(t.costEstimate ?? 0),
        formatCurrency(t.actualCost ?? 0),
      ]);

      autoTable(doc, {
        startY: startY + 5,
        head: [["Task", "Type", "Status", "Estimated", "Actual"]],
        body: taskBody,
        theme: "striped",
        headStyles: { fillColor: [147, 51, 234] },
        columnStyles: {
          3: { halign: "right" },
          4: { halign: "right" },
        },
      });
    }

    // Budget Lines Table
    if (budgetLines?.length) {
      const lastTableY = (doc as any).lastAutoTable?.finalY;

      const startY = lastTableY ? lastTableY + 15 : 140;

      doc.setFontSize(14);
      doc.text("Budget Lines", 14, startY);

      const budgetBody: string[][] = budgetLines.map((line) => {
        const total = line.qty * line.rate * (1 + line.taxPercent / 100);
        return [
          line.name || "N/A",
          line.department || "-",
          String(line.qty),
          formatCurrency(line.rate),
          formatCurrency(total),
        ];
      });

      autoTable(doc, {
        startY: startY + 5,
        head: [["Name", "Department", "Qty", "Rate", "Total"]],
        body: budgetBody,
        theme: "striped",
        headStyles: { fillColor: [37, 99, 235] },
        columnStyles: {
          2: { halign: "right" },
          3: { halign: "right" },
          4: { halign: "right" },
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
    }

    const filename = `PostProduction_${selectedProject.title.replace(/\s+/g, "_")}_${
      new Date().toISOString().split("T")[0]
    }.pdf`;
    doc.save(filename);
  };

  // Handle ROI update
  const handleUpdateROI = async () => {
    if (!selectedProject) return;

    try {
      setSubmitting(true);
      const response = await updateROIWithPostProduction(selectedProject.id);
      if (response.success) {
        alert("Spent updated successfully!");
        console.log("Updated metrics:", response.data);
      } else {
        throw new Error(response.message || "Failed to update Spent");
      }
    } catch (err: any) {
      console.error("Error updating Spent:", err);
      alert(err.message || "Failed to update Spent");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Add/Edit Task
  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    setSubmitting(true);

    try {
      const data = {
        name: taskFormData.name,
        type: taskFormData.type,
        costEstimate: parseFloat(taskFormData.costEstimate) || 0,
        actualCost: taskFormData.actualCost
          ? parseFloat(taskFormData.actualCost)
          : null,
        dueDate: taskFormData.dueDate || null,
        status: taskFormData.status,
        notes: taskFormData.notes || null,
        vendorId: taskFormData.vendorId || null,
      };

      let response;
      if (editingTask) {
        response = await updatePostTask(
          selectedProject.id,
          editingTask.id,
          data
        );
      } else {
        response = await createPostTask(selectedProject.id, data);
      }

      if (response.success) {
        alert(
          editingTask
            ? "Task updated successfully!"
            : "Task created successfully!"
        );
        closeTaskModal();
        fetchAllData();
      } else {
        throw new Error(response.message || "Failed to save task");
      }
    } catch (err: any) {
      console.error("Error saving task:", err);
      alert(err.message || "Failed to save task");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Task
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    if (!selectedProject) return;

    try {
      const response = await deletePostTask(selectedProject.id, taskId);
      if (response.success) {
        alert("Task deleted successfully!");
        fetchAllData();
      }
    } catch (err: any) {
      console.error("Error deleting task:", err);
      alert(err.message || "Failed to delete task");
    }
  };

  // Handle Add Budget Line
  const handleBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    setSubmitting(true);

    try {
      const data = {
        ...budgetFormData,
        rate: parseFloat(budgetFormData.rate) || 0,
      };

      const response = await addPostBudgetLine(selectedProject.id, data);

      if (response.success) {
        alert("Budget line added successfully!");
        closeBudgetModal();
        fetchAllData();
      } else {
        throw new Error(response.message || "Failed to add budget line");
      }
    } catch (err: any) {
      console.error("Error adding budget line:", err);
      alert(err.message || "Failed to add budget line");
    } finally {
      setSubmitting(false);
    }
  };

  const openTaskModal = (task: PostTask | null = null) => {
    if (task) {
      setEditingTask(task);
      setTaskFormData({
        name: task.name,
        type: task.type || "EDITING",
        costEstimate: task.costEstimate.toString(),
        actualCost: task.actualCost?.toString() || "",
        dueDate: task.dueDate?.split("T")[0] ?? "",
        status: task.status,
        notes: task.notes || "",
        vendorId: task.vendorId || "",
      });
    } else {
      setEditingTask(null);
      setTaskFormData({
        name: "",
        type: "EDITING",
        costEstimate: "",
        actualCost: "",
        dueDate: "",
        status: "PENDING",
        notes: "",
        vendorId: "",
      });
    }
    setShowTaskModal(true);
  };

  const closeTaskModal = () => {
    setShowTaskModal(false);
    setEditingTask(null);
  };

  const closeBudgetModal = () => {
    setShowBudgetModal(false);
    setBudgetFormData({
      name: "",
      department: "Post Production",
      vendor: "",
      qty: 1,
      rate: "",
      taxPercent: 0,
      notes: "",
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-purple-100 rounded-lg">
            <Video className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Post Production
            </h1>
            <p className="text-gray-600">
              Manage post-production tasks, budgets, and forecasts
            </p>
          </div>
        </div>
      </div>

      {/* Project Selector */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Select Project
        </label>
        <select
          value={selectedProject?.id || ""}
          onChange={(e) => {
            const project = projects.find((p) => p.id === e.target.value);
            setSelectedProject(project || null);
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Project Selected
          </h3>
          <p className="text-gray-600">
            Please select a project to manage post-production
          </p>
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
              onClick={exportPostProdToPDF}
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
          {forecast && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-600">Total Estimated</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(forecast.summary.totalEstimated)}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600">Total Actual</p>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(forecast.summary.totalActual)}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Package className="w-5 h-5 text-orange-600" />
                  </div>
                  <p className="text-sm text-gray-600">Remaining</p>
                </div>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(forecast.summary.remaining)}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-sm text-gray-600">Spent</p>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {forecast.summary.completionPercentage.toFixed(1)}%
                </p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                {[
                  { key: "tasks", label: `Tasks (${tasks.length})` },
                  {
                    key: "budget",
                    label: `Budget Lines (${budgetLines.length})`,
                  },
                  { key: "forecast", label: "Forecast" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.key
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* TASKS TAB */}
              {activeTab === "tasks" && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Post Tasks
                    </h3>
                    <button
                      onClick={() => openTaskModal()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Add Task
                    </button>
                  </div>

                  {tasks.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">
                        No post-production tasks yet
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Task Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Status
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                              Estimated
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
                          {tasks.map((task) => (
                            <tr key={task.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                {task.name}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {task.type || "N/A"}
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded ${
                                    task.status === "COMPLETED"
                                      ? "bg-green-100 text-green-800"
                                      : task.status === "IN_PROGRESS"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {task.status.replace("_", " ")}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-right text-gray-900">
                                {formatCurrency(task.costEstimate ?? 0)}
                              </td>
                              <td className="px-6 py-4 text-sm text-right">
                                {task.actualCost ? (
                                  <span className="text-blue-600 font-medium">
                                    {formatCurrency(task.actualCost)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right text-sm">
                                <button
                                  onClick={() => openTaskModal(task)}
                                  className="text-blue-600 hover:text-blue-900 mr-3"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="text-red-600 hover:text-red-900"
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

              {/* BUDGET TAB */}
              {activeTab === "budget" && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Budget Lines
                    </h3>
                    <button
                      onClick={() => setShowBudgetModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Add Budget Line
                    </button>
                  </div>

                  {budgetLines.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No budget lines yet</p>
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
                              line.qty *
                              line.rate *
                              (1 + line.taxPercent / 100);
                            return (
                              <tr key={line.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                  {line.name}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                  {line.department || "-"}
                                </td>
                                <td className="px-6 py-4 text-sm text-right text-gray-900">
                                  {line.qty}
                                </td>
                                <td className="px-6 py-4 text-sm text-right text-gray-900">
                                  {formatCurrency(line.rate)}
                                </td>
                                <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
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

              {/* FORECAST TAB */}
              {activeTab === "forecast" && forecast && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Financial Summary
                  </h3>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Completion Progress</span>
                      <span>
                        {forecast.summary.completionPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(forecast.summary.completionPercentage, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Tasks by Type */}
                  {forecast.tasks.byType &&
                    Object.keys(forecast.tasks.byType).length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">
                          Tasks by Type
                        </h4>
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <table className="min-w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Type
                                </th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                  Count
                                </th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                  Estimated
                                </th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                  Actual
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {Object.entries(forecast.tasks.byType).map(
                                ([type, data]) => (
                                  <tr key={type}>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                      {type}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                                      {data.count}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                                      {formatCurrency(data.estimated)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right text-blue-600 font-medium">
                                      {formatCurrency(data.actual)}
                                    </td>
                                  </tr>
                                )
                              )}
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
      )}

      {/* TASK MODAL */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingTask ? "Edit Post Task" : "Add Post Task"}
                </h2>
                <button
                  onClick={closeTaskModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleTaskSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Task Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={taskFormData.name}
                    onChange={(e) =>
                      setTaskFormData({ ...taskFormData, name: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Final Color Grading"
                  />
                </div>

                {/* Task Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={taskFormData.type}
                    onChange={(e) =>
                      setTaskFormData({
                        ...taskFormData,
                        type: e.target.value as any,
                      })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="EDITING">Editing</option>
                    <option value="COLOR">Color Grading</option>
                    <option value="AUDIO">Audio Mixing</option>
                    <option value="MUSIC">Music/Score</option>
                    <option value="VFX">VFX</option>
                    <option value="QC">Quality Control</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={taskFormData.status}
                    onChange={(e) =>
                      setTaskFormData({
                        ...taskFormData,
                        status: e.target.value as any,
                      })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>

                {/* Cost Estimate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost Estimate <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={taskFormData.costEstimate}
                    onChange={(e) =>
                      setTaskFormData({
                        ...taskFormData,
                        costEstimate: e.target.value,
                      })
                    }
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                {/* Actual Cost */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Actual Cost
                  </label>
                  <input
                    type="number"
                    value={taskFormData.actualCost}
                    onChange={(e) =>
                      setTaskFormData({
                        ...taskFormData,
                        actualCost: e.target.value,
                      })
                    }
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={taskFormData.dueDate}
                    onChange={(e) =>
                      setTaskFormData({
                        ...taskFormData,
                        dueDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={taskFormData.notes}
                    onChange={(e) =>
                      setTaskFormData({
                        ...taskFormData,
                        notes: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Additional notes about this task..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeTaskModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting
                    ? "Saving..."
                    : editingTask
                      ? "Update Task"
                      : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BUDGET MODAL */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Add Post Production Budget Line
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
                {/* Line Item Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Line Item Name <span className="text-red-500">*</span>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., VFX Rendering Services"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={budgetFormData.department}
                    onChange={(e) =>
                      setBudgetFormData({
                        ...budgetFormData,
                        department: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Vendor */}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Vendor name"
                  />
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={budgetFormData.qty}
                    onChange={(e) =>
                      setBudgetFormData({
                        ...budgetFormData,
                        qty: Number(e.target.value),
                      })
                    }
                    required
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rate <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={budgetFormData.rate}
                    onChange={(e) =>
                      setBudgetFormData({
                        ...budgetFormData,
                        rate: e.target.value,
                      })
                    }
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                {/* Tax Percent */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax %
                  </label>
                  <input
                    type="number"
                    value={budgetFormData.taxPercent}
                    onChange={(e) =>
                      setBudgetFormData({
                        ...budgetFormData,
                        taxPercent: Number(e.target.value),
                      })
                    }
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                {/* Calculated Total */}
                <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      Line Total:
                    </span>
                    <span className="text-xl font-bold text-blue-600">
                      $
                      {(
                        (budgetFormData.qty || 0) *
                        (parseFloat(budgetFormData.rate) || 0) *
                        (1 + (budgetFormData.taxPercent || 0) / 100)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Notes */}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Additional notes..."
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? "Adding..." : "Add Budget Line"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
