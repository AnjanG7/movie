"use client";

import React, {
  useState,
  useEffect,
  FormEvent,
  ChangeEvent,
  Suspense,
} from "react";
import { useSearchParams } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Download,
  FileText,
  DollarSign,
  Calendar,
  AlertCircle,
  Plus,
  Filter,
  ChevronDown,
  ChevronRight,
  Trash2,
  ShoppingCart,
} from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

/* ===================== TYPES ===================== */

interface PurchaseOrder {
  id: string;
  docNo: string;
  poNo: string;
  projectId: string;
  vendorId: string;
  amount: number;
  status: "Pending" | "Approved" | "Rejected";
  createdAt: string;
  description?: string;
  paymentTerms?: string;
  vendor?: {
    id: string;
    name: string;
    currency: string;
    email?: string;
    phone?: string;
  };
  budgetLine?: {
    id: string;
    name: string;
    phase: string;
  };
}

interface Project {
  id: string;
  title: string;
}

interface Vendor {
  id: string;
  name: string;
  currency: string;
  email?: string;
  phone?: string;
}

interface BudgetLine {
  id: string;
  name: string;
  phase: string;
  remaining: number;
}

interface POFormData {
  vendorId: string;
  amount: number;
  description: string;
  paymentTerms: string;
  budgetLineId: string;
}

/* ===================== COMPONENT ===================== */

function PurchaseOrdersContent() {
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get("projectId");

  const [projects, setProjects] = useState<Project[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(
    projectIdParam || ""
  );
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [expandedPOId, setExpandedPOId] = useState<string | null>(null);

  const [formData, setFormData] = useState<POFormData>({
    vendorId: "",
    amount: 0,
    description: "",
    paymentTerms: "Net 30 days",
    budgetLineId: "",
  });

  /* ===================== FETCHERS ===================== */

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchVendors(selectedProjectId);
      fetchBudgetLines(selectedProjectId);
      fetchPurchaseOrders(selectedProjectId);
    } else {
      setPurchaseOrders([]);
      setVendors([]);
      setBudgetLines([]);
    }
  }, [selectedProjectId, selectedStatus]);

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/projects?limit=99999`, {
        credentials: "include",
      });
      const json = await res.json();
      if (json.success) setProjects(json.data.projects || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchVendors = async (projectId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/vendors/project/${projectId}`, {
        credentials: "include",
      });
      const json = await res.json();
      setVendors(json.data?.vendors || []);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      setVendors([]);
    }
  };

  const fetchBudgetLines = async (projectId: string) => {
    if (!projectId) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/${projectId}/budget-lines`,
        { credentials: "include" }
      );

      if (!response.ok) {
        setBudgetLines([]);
        return;
      }

      const result = await response.json();

      if (result.success) {
        const lines = result.data?.lines || result.data?.budgetLines || [];
        setBudgetLines(lines);
      } else {
        setBudgetLines([]);
      }
    } catch (error) {
      console.error("Error fetching budget lines:", error);
      setBudgetLines([]);
    }
  };

  const fetchPurchaseOrders = async (projectId: string) => {
    if (!projectId) return;

    setLoading(true);
    try {
      const statusQuery =
        selectedStatus !== "all" ? `?status=${selectedStatus}` : "";
      const res = await fetch(
        `${API_BASE_URL}/projects/${projectId}/purchase-orders${statusQuery}`,
        { credentials: "include" }
      );
      const json = await res.json();
      setPurchaseOrders(json.data?.purchaseOrders || []);
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
    } finally {
      setLoading(false);
    }
  };

  /* ===================== PDF EXPORT ===================== */

  const handleDownloadPDF = () => {
    if (purchaseOrders.length === 0) {
      alert("No purchase orders to download");
      return;
    }

    const doc = new jsPDF("l", "mm", "a4");
    const selectedProject = projects.find((p) => p.id === selectedProjectId);
    const projectTitle = selectedProject?.title || "Project";

    // Add header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Purchase Orders Report", 14, 20);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Project: ${projectTitle}`, 14, 28);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 34);

    // Calculate totals
    const totalAmount = purchaseOrders.reduce((sum, po) => sum + po.amount, 0);
    const approvedCount = purchaseOrders.filter(
      (po) => po.status === "Approved"
    ).length;
    const pendingCount = purchaseOrders.filter(
      (po) => po.status === "Pending"
    ).length;
    const rejectedCount = purchaseOrders.filter(
      (po) => po.status === "Rejected"
    ).length;

    // Add summary section
    doc.setFontSize(10);
    doc.text(
      `Total POs: ${purchaseOrders.length} | Approved: ${approvedCount} | Pending: ${pendingCount} | Rejected: ${rejectedCount}`,
      14,
      42
    );
    doc.text(`Total Amount: $${totalAmount.toLocaleString()}`, 14, 48);

    // Prepare table data
    const tableData = purchaseOrders.map((po) => [
      po.poNo || po.docNo || "N/A",
      po.vendor?.name || "N/A",
      `${po.vendor?.currency || ""} ${po.amount.toLocaleString()}`,
      po.budgetLine ? `${po.budgetLine.phase} - ${po.budgetLine.name}` : "N/A",
      po.status,
      new Date(po.createdAt).toLocaleDateString(),
      po.description || "",
    ]);

    // Add table
    autoTable(doc, {
      head: [
        [
          "PO Number",
          "Vendor",
          "Amount",
          "Budget Line",
          "Status",
          "Created Date",
          "Description",
        ],
      ],
      body: tableData,
      startY: 55,
      theme: "striped",
      headStyles: {
        fillColor: [59, 130, 246],
        fontSize: 10,
        fontStyle: "bold",
        halign: "left",
        textColor: [255, 255, 255],
      },
      bodyStyles: {
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 45 },
        2: { cellWidth: 30 },
        3: { cellWidth: 50 },
        4: { cellWidth: 25 },
        5: { cellWidth: 30 },
        6: { cellWidth: 50 },
      },
      didDrawCell: (data) => {
        if (data.column.index === 4 && data.section === "body") {
          const status = data.cell.raw as string;
          if (status === "Approved") {
            doc.setFillColor(220, 252, 231);
          } else if (status === "Pending") {
            doc.setFillColor(191, 219, 254);
          } else if (status === "Rejected") {
            doc.setFillColor(254, 226, 226);
          }
        }
      },
      didDrawPage: (data) => {
        const pageCount = doc.getNumberOfPages();
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height || pageSize.getHeight();
        const pageWidth = pageSize.width || pageSize.getWidth();

        doc.setFontSize(8);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
      },
    });

    const fileName = `Purchase_Orders_${projectTitle.replace(/\s+/g, "_")}_${new Date().getTime()}.pdf`;
    doc.save(fileName);
  };

  /* ===================== ACTIONS ===================== */

  const handleCreatePO = async (e: FormEvent, retryCount = 0) => {
    e.preventDefault();
    if (!selectedProjectId) {
      alert("Please select a project first");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/purchase-orders`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vendorId: formData.vendorId,
            amount: formData.amount,
            budgetLineId: formData.budgetLineId || null,
            // Note: description and paymentTerms are not supported by backend yet
            // They will be stored in a future schema update
          }),
        }
      );

      const json = await res.json();
      if (json.success) {
        alert("Purchase order created successfully!");
        setShowCreateModal(false);
        setFormData({
          vendorId: "",
          amount: 0,
          description: "",
          paymentTerms: "Net 30 days",
          budgetLineId: "",
        });
        fetchPurchaseOrders(selectedProjectId);
        fetchBudgetLines(selectedProjectId);
      } else {
        // Check if it's a duplicate poNo error and retry
        const isDuplicatePoNo = json.errors?.some(
          (err: any) => err.path === "poNo"
        );

        if (isDuplicatePoNo && retryCount < 3) {
          console.log(
            `Duplicate PO number detected. Retrying... (Attempt ${retryCount + 1}/3)`
          );
          // Wait a bit and retry
          await new Promise((resolve) =>
            setTimeout(resolve, 500 * (retryCount + 1))
          );
          return handleCreatePO(e, retryCount + 1);
        }

        alert(json.message || "Failed to create purchase order");
      }
    } catch (error) {
      console.error("Error creating purchase order:", error);
      alert("Failed to create purchase order");
    }
  };

  const handleUpdateStatus = async (poId: string, status: string) => {
    if (!selectedProjectId) return;
    if (!confirm(`Change status to ${status}?`)) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/purchase-orders/${poId}/status`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );

      const json = await res.json();
      if (json.success) {
        alert(`Purchase order status updated to ${status}`);
        fetchPurchaseOrders(selectedProjectId);
        fetchBudgetLines(selectedProjectId);
      } else {
        alert(json.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  const handleDelete = async (poId: string) => {
    if (!selectedProjectId) return;
    if (
      !confirm(
        "Are you sure you want to delete this purchase order? This action cannot be undone."
      )
    )
      return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/purchase-orders/${poId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const json = await res.json();
      if (json.success) {
        alert("Purchase order deleted successfully");
        fetchPurchaseOrders(selectedProjectId);
        fetchBudgetLines(selectedProjectId);
      } else {
        alert(json.message || "Failed to delete purchase order");
      }
    } catch (error) {
      console.error("Error deleting purchase order:", error);
      alert("Failed to delete purchase order");
    }
  };

  const handleFormChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "amount" ? Number(value) : value,
    }));
  };

  const toggleExpandPO = (poId: string) => {
    setExpandedPOId(expandedPOId === poId ? null : poId);
  };

  // Calculate totals
  const totalOrdered = purchaseOrders.reduce((sum, po) => sum + po.amount, 0);
  const approvedPOs = purchaseOrders.filter((po) => po.status === "Approved");
  const pendingPOs = purchaseOrders.filter((po) => po.status === "Pending");
  const totalApproved = approvedPOs.reduce((sum, po) => sum + po.amount, 0);
  const totalPending = pendingPOs.reduce((sum, po) => sum + po.amount, 0);
  const distinctVendors = Array.from(
    new Set(purchaseOrders.map((po) => po.vendor?.name).filter(Boolean))
  ).length;

  /* ===================== UI ===================== */

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
          <div>
            <p className="text-xs font-semibold tracking-widest text-blue-600 uppercase mb-1">
              Procurement Management
            </p>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              Purchase Orders
            </h1>
            <p className="text-slate-600 mt-2 text-sm lg:text-base">
              Manage vendor purchase orders, approvals, and budget allocations
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">
                Project:
              </span>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="h-10 rounded-lg border border-slate-300 px-3 text-sm bg-white min-w-[220px]"
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
                  onClick={() => setShowCreateModal(true)}
                  className="px-5 h-11 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 text-white text-sm font-semibold shadow-lg hover:from-blue-700 hover:to-indigo-600 flex items-center gap-2"
                >
                  <Plus size={18} />
                  Create Purchase Order
                </button>
                {purchaseOrders.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDownloadPDF}
                    className="px-5 h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-sm font-semibold shadow-lg hover:from-emerald-700 hover:to-teal-600 flex items-center gap-2"
                  >
                    <Download size={18} />
                    Download PDF
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {!selectedProjectId ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
            <ShoppingCart className="mx-auto mb-4 text-slate-400" size={48} />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No Project Selected
            </h3>
            <p className="text-slate-600">
              Please select a project from the dropdown above to view and manage
              purchase orders.
            </p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="rounded-2xl border border-blue-100 bg-white shadow-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="text-blue-600" size={18} />
                  <div className="text-xs font-semibold text-slate-500 uppercase">
                    Total Ordered
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  ${totalOrdered.toLocaleString()}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  All purchase orders
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-white shadow-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="text-emerald-600" size={18} />
                  <div className="text-xs font-semibold text-slate-500 uppercase">
                    Approved
                  </div>
                </div>
                <div className="text-2xl font-bold text-emerald-600">
                  ${totalApproved.toLocaleString()}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {approvedPOs.length} orders approved
                </div>
              </div>

              <div className="rounded-2xl border border-amber-100 bg-white shadow-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="text-amber-600" size={18} />
                  <div className="text-xs font-semibold text-slate-500 uppercase">
                    Pending
                  </div>
                </div>
                <div className="text-2xl font-bold text-amber-600">
                  ${totalPending.toLocaleString()}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {pendingPOs.length} orders pending
                </div>
              </div>

              <div className="rounded-2xl border border-purple-100 bg-white shadow-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="text-purple-600" size={18} />
                  <div className="text-xs font-semibold text-slate-500 uppercase">
                    Vendors
                  </div>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {distinctVendors}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Unique vendors
                </div>
              </div>
            </div>

            {/* Filter */}
            <div className="mb-6 flex items-center gap-3">
              <Filter size={18} className="text-slate-600" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-10 border border-slate-300 rounded-lg px-3 text-sm bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {/* Purchase Orders List */}
            <div className="mt-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-slate-500 font-medium">
                      Loading purchase orders...
                    </p>
                  </div>
                </div>
              ) : purchaseOrders.length === 0 ? (
                <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl border-2 border-dashed border-slate-300 p-16 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-slate-600 text-base leading-relaxed">
                      No purchase orders found. Create your first purchase order
                      to start tracking vendor commitments.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {purchaseOrders.map((po) => (
                    <div
                      key={po.id}
                      className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                    >
                      {/* PO Header - Clickable */}
                      <div
                        onClick={() => toggleExpandPO(po.id)}
                        className="flex items-center justify-between p-5 cursor-pointer hover:bg-gradient-to-r hover:from-slate-50 hover:to-transparent transition-all duration-150"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                            {expandedPOId === po.id ? (
                              <ChevronDown
                                size={18}
                                className="text-slate-600"
                              />
                            ) : (
                              <ChevronRight
                                size={18}
                                className="text-slate-600"
                              />
                            )}
                          </div>

                          <div className="flex items-center gap-8 flex-1 min-w-0">
                            <div className="min-w-0">
                              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                                PO Number
                              </div>
                              <div className="font-bold text-blue-600 text-base">
                                {po.poNo || po.docNo}
                              </div>
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                                Vendor
                              </div>
                              <div className="font-semibold text-slate-900 truncate">
                                {po.vendor?.name || "N/A"}
                              </div>
                            </div>

                            <div className="min-w-0">
                              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                                Amount
                              </div>
                              <div className="font-bold text-slate-900 text-base">
                                {po.vendor?.currency} $
                                {po.amount.toLocaleString()}
                              </div>
                            </div>

                            <div className="min-w-0">
                              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                                Status
                              </div>
                              <div>
                                {po.status === "Approved" && (
                                  <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span>
                                    Approved
                                  </span>
                                )}
                                {po.status === "Pending" && (
                                  <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-2 animate-pulse"></span>
                                    Pending
                                  </span>
                                )}
                                {po.status === "Rejected" && (
                                  <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                                    Rejected
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedPOId === po.id && (
                        <div className="border-t border-slate-200 bg-gradient-to-br from-slate-50/50 to-slate-100/30">
                          <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                  <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
                                  Purchase Order Details
                                </h4>
                                <div className="space-y-3 text-sm">
                                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                    <span className="text-slate-600 font-medium">
                                      PO Number:
                                    </span>
                                    <span className="font-semibold text-slate-900">
                                      {po.poNo || po.docNo}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                    <span className="text-slate-600 font-medium">
                                      Budget Line:
                                    </span>
                                    <span className="font-semibold text-slate-900 text-right max-w-[60%] truncate">
                                      {po.budgetLine
                                        ? `${po.budgetLine.phase} - ${po.budgetLine.name}`
                                        : "N/A"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                    <span className="text-slate-600 font-medium">
                                      Payment Terms:
                                    </span>
                                    <span className="font-semibold text-slate-900">
                                      {po.paymentTerms || "Net 30 days"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center py-2">
                                    <span className="text-slate-600 font-medium">
                                      Created:
                                    </span>
                                    <span className="font-semibold text-slate-900">
                                      {new Date(
                                        po.createdAt
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                  <span className="w-1 h-4 bg-emerald-600 rounded-full"></span>
                                  Vendor Information
                                </h4>
                                <div className="space-y-3 text-sm">
                                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                    <span className="text-slate-600 font-medium">
                                      Vendor Name:
                                    </span>
                                    <span className="font-semibold text-slate-900">
                                      {po.vendor?.name || "N/A"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                    <span className="text-slate-600 font-medium">
                                      Currency:
                                    </span>
                                    <span className="font-semibold text-slate-900">
                                      {po.vendor?.currency || "N/A"}
                                    </span>
                                  </div>
                                  {po.vendor?.email && (
                                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                      <span className="text-slate-600 font-medium">
                                        Email:
                                      </span>
                                      <span className="font-semibold text-slate-900 truncate max-w-[60%]">
                                        {po.vendor.email}
                                      </span>
                                    </div>
                                  )}
                                  {po.vendor?.phone && (
                                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                      <span className="text-slate-600 font-medium">
                                        Phone:
                                      </span>
                                      <span className="font-semibold text-slate-900">
                                        {po.vendor.phone}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex justify-between items-center pt-3 mt-2 bg-slate-50 -mx-2 px-4 py-3 rounded-lg">
                                    <span className="text-slate-700 font-bold">
                                      Order Amount:
                                    </span>
                                    <span className="font-bold text-lg text-slate-900">
                                      {po.vendor?.currency} $
                                      {po.amount.toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {po.description && (
                              <div className="mb-6">
                                <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                  <span className="w-1 h-4 bg-purple-600 rounded-full"></span>
                                  Description
                                </h4>
                                <p className="text-sm text-slate-700 leading-relaxed bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                  {po.description}
                                </p>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-5 border-t border-slate-200">
                              <div className="flex gap-3">
                                {po.status === "Pending" && (
                                  <>
                                    <button
                                      onClick={() =>
                                        handleUpdateStatus(po.id, "Approved")
                                      }
                                      className="text-sm px-5 py-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 font-semibold shadow-sm hover:shadow-md transition-all duration-150 flex items-center gap-2"
                                    >
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M5 13l4 4L19 7"
                                        />
                                      </svg>
                                      Approve
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleUpdateStatus(po.id, "Rejected")
                                      }
                                      className="text-sm px-5 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 active:bg-red-800 font-semibold shadow-sm hover:shadow-md transition-all duration-150 flex items-center gap-2"
                                    >
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M6 18L18 6M6 6l12 12"
                                        />
                                      </svg>
                                      Reject
                                    </button>
                                  </>
                                )}
                              </div>

                              <button
                                onClick={() => handleDelete(po.id)}
                                className="text-sm px-5 py-2.5 rounded-lg border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 active:bg-red-100 font-semibold transition-all duration-150 flex items-center gap-2"
                              >
                                <Trash2 size={16} />
                                Delete PO
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Create PO Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Create Purchase Order</h2>
              <form onSubmit={handleCreatePO} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Vendor <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="vendorId"
                    value={formData.vendorId}
                    onChange={handleFormChange}
                    required
                    className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm"
                  >
                    <option value="">-- Select Vendor --</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleFormChange}
                    required
                    min={0}
                    step={0.01}
                    className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Budget Line
                  </label>
                  <select
                    name="budgetLineId"
                    value={formData.budgetLineId}
                    onChange={handleFormChange}
                    className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm"
                  >
                    <option value="">No Budget Line</option>
                    {budgetLines.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.phase} - {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Payment Terms
                  </label>
                  <input
                    name="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={handleFormChange}
                    placeholder="Net 30 days"
                    className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    rows={3}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Optional description or notes"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormData({
                        vendorId: "",
                        amount: 0,
                        description: "",
                        paymentTerms: "Net 30 days",
                        budgetLineId: "",
                      });
                    }}
                    className="flex-1 h-10 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-500 text-white font-semibold hover:from-blue-700 hover:to-indigo-600"
                  >
                    Create PO
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

/* ===================== PAGE ===================== */

export default function PurchaseOrdersPage() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <PurchaseOrdersContent />
    </Suspense>
  );
}
