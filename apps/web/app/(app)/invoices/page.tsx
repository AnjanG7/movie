"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent } from "react";
import {
  FileText,
  Calendar,
  AlertCircle,
  Plus,
  Filter,
  Download,
  ChevronDown,
  ChevronRight,
  Trash2,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://film-finance-app.onrender.com/api";

interface Invoice {
  id: string;
  docNo: string;
  poId: string;
  vendorId: string;
  amount: number;
  date: string;
  dueDate: string | null;
  status: "Pending" | "Approved" | "Paid" | "Rejected";
  attachments?: any | null;
  notes?: string | null;
  createdAt: string;
  vendor?: {
    id: string;
    name: string;
    currency?: string;
  };
  po?: {
    id: string;
    poNo: string;
    amount: number;
    project?: {
      id: string;
      title: string;
      baseCurrency?: string; // Added
    };
  };
}

interface PurchaseOrder {
  id: string;
  poNo: string;
  amount: number;
  vendor: {
    id: string;
    name: string;
    currency?: string;
  };
  project?: {
    id: string;
    title: string;
    baseCurrency?: string; // Added
  };
  budgetLine?: {
    name: string;
  };
}

interface Project {
  id: string;
  title: string;
  baseCurrency?: string; // Added
}

interface POBalance {
  poAmount: number;
  totalInvoiced: number;
  remainingBalance: number;
}

interface InvoiceFormData {
  poId: string;
  amount: number;
  date: string;
  dueDate: string;
  notes: string;
}

export default function InvoicesPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [poBalance, setPOBalance] = useState<POBalance | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(
    null
  );
  const [formData, setFormData] = useState<InvoiceFormData>({
    poId: "",
    amount: 0,
    date: new Date()?.toISOString()?.split("T")?.[0] ?? "",
    dueDate: "",
    notes: "",
  });

  // Get selected project
  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const projectCurrency = selectedProject?.baseCurrency || "$";

  // Helper function to format currency
  const formatCurrency = (amount: number, currency?: string) => {
    const curr = currency || projectCurrency;
    return `${curr} ${amount.toLocaleString()}`;
  };

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch invoices when project or status changes
  useEffect(() => {
    if (selectedProjectId) {
      fetchInvoices();
      fetchPurchaseOrders();
    } else {
      setInvoices([]);
      setPurchaseOrders([]);
    }
  }, [selectedProjectId, selectedStatus]);

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects?limit=99999`, {
        credentials: "include",
      });
      const result = await response.json();
      if (result.success) {
        setProjects(result.data.projects || []);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  // Fetch invoices for selected project
  const fetchInvoices = async () => {
    if (!selectedProjectId) return;

    setLoading(true);
    try {
      const statusQuery =
        selectedStatus !== "all" ? `?status=${selectedStatus}` : "";
      const response = await fetch(
        `${API_BASE_URL}/invoices/project/${selectedProjectId}${statusQuery}`,
        {
          credentials: "include",
        }
      );
      const result = await response.json();
      if (result.success) {
        setInvoices(result.data.invoices || []);
      } else {
        console.error("Error:", result.message);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch purchase orders for dropdown
  const fetchPurchaseOrders = async () => {
    if (!selectedProjectId) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/purchase-orders?status=Approved`,
        {
          credentials: "include",
        }
      );
      const result = await response.json();
      if (result.success) {
        setPurchaseOrders(result.data.purchaseOrders || []);
      }
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
    }
  };

  // Fetch PO balance when PO is selected
  const fetchPOBalance = async (poId: string) => {
    if (!poId || !selectedProjectId) {
      setPOBalance(null);
      return;
    }
    try {
      const response = await fetch(
        `${API_BASE_URL}/invoices/po/${poId}/balance`,
        {
          credentials: "include",
        }
      );
      const result = await response.json();
      if (result.success) {
        setPOBalance(result.data);
      }
    } catch (error) {
      console.error("Error fetching PO balance:", error);
    }
  };

  // Handle form input changes
  const handleFormChange = (
    e: ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "amount") {
      setFormData((prev) => ({ ...prev, [name]: Number(value) }));
    } else if (name === "poId") {
      const selectedPO = purchaseOrders.find((po) => po.id === value);
      fetchPOBalance(value);
      setFormData((prev) => ({
        ...prev,
        poId: value,
        amount: selectedPO?.amount || 0,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Create new invoice
  const handleCreateInvoice = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProjectId) {
      alert("Please select a project first");
      return;
    }

    try {
      const selectedPO = purchaseOrders.find((po) => po.id === formData.poId);
      if (!selectedPO) {
        alert("Please select a purchase order");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/invoices/project/${selectedProjectId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            vendorId: selectedPO.vendor.id,
            poId: formData.poId,
            amount: formData.amount,
            date: formData.date,
            dueDate: formData.dueDate || null,
            notes: formData.notes || null,
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        alert("Invoice created successfully!");
        setShowCreateModal(false);
        setFormData({
          poId: "",
          amount: 0,
          date: new Date().toISOString().split("T")[0]!,
          dueDate: "",
          notes: "",
        });
        setPOBalance(null);
        fetchInvoices();
      } else {
        alert(result.message || "Failed to create invoice");
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      alert("Failed to create invoice");
    }
  };

  // Update invoice status
  const handleUpdateStatus = async (invoiceId: string, newStatus: string) => {
    if (!selectedProjectId) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/invoices/project/${selectedProjectId}/${invoiceId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const result = await response.json();
      if (result.success) {
        alert(`Invoice status updated to ${newStatus}`);
        fetchInvoices();
      } else {
        alert(result.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating invoice status:", error);
      alert("Failed to update status");
    }
  };

  // Delete invoice
  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!selectedProjectId) return;

    if (
      !confirm(
        "Are you sure you want to delete this invoice? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/invoices/project/${selectedProjectId}/${invoiceId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const result = await response.json();
      if (result.success) {
        alert("Invoice deleted successfully");
        fetchInvoices();
      } else {
        alert(result.message || "Failed to delete invoice");
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
      alert("Failed to delete invoice");
    }
  };

  // Download PDF with all invoices data
  const handleDownloadPDF = () => {
    if (invoices.length === 0) {
      alert("No invoices to download");
      return;
    }

    const doc = new jsPDF("l", "mm", "a4"); // Landscape
    const projectName = selectedProject?.title || "Project";

    // Add header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Invoice Report", 14, 20);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Project: ${projectName}`, 14, 28);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 34);

    // Calculate totals
    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const approvedCount = invoices.filter(
      (inv) => inv.status === "Approved"
    ).length;
    const paidCount = invoices.filter((inv) => inv.status === "Paid").length;
    const pendingCount = invoices.filter(
      (inv) => inv.status === "Pending"
    ).length;
    const rejectedCount = invoices.filter(
      (inv) => inv.status === "Rejected"
    ).length;

    // Add summary
    doc.setFontSize(10);
    doc.text(
      `Total Invoices: ${invoices.length} | Approved: ${approvedCount} | Paid: ${paidCount} | Pending: ${pendingCount} | Rejected: ${rejectedCount}`,
      14,
      42
    );
    doc.text(`Total Amount: ${formatCurrency(totalInvoiced)}`, 14, 48);

    // Prepare table data
    const tableData = invoices.map((invoice) => [
      invoice.docNo || "N/A",
      invoice.vendor?.name || "N/A",
      invoice.po?.poNo || "N/A",
      formatCurrency(invoice.amount, invoice.po?.project?.baseCurrency),
      invoice.date ? new Date(invoice.date).toLocaleDateString() : "N/A",
      invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "N/A",
      invoice.status,
      invoice.notes || "",
    ]);

    // Add table
    autoTable(doc, {
      head: [
        [
          "Invoice #",
          "Vendor",
          "PO #",
          "Amount",
          "Invoice Date",
          "Due Date",
          "Status",
          "Notes",
        ],
      ],
      body: tableData,
      startY: 55,
      theme: "striped",
      headStyles: {
        fillColor: [59, 130, 246], // Blue
        fontSize: 10,
        fontStyle: "bold",
        halign: "left",
        textColor: [255, 255, 255],
      },
      bodyStyles: {
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 25 }, // Invoice #
        1: { cellWidth: 45 }, // Vendor
        2: { cellWidth: 25 }, // PO #
        3: { cellWidth: 25 }, // Amount
        4: { cellWidth: 30 }, // Invoice Date
        5: { cellWidth: 30 }, // Due Date
        6: { cellWidth: 25 }, // Status
        7: { cellWidth: 50 }, // Notes
      },
      didDrawCell: (data) => {
        // Color code status column
        if (data.column.index === 6 && data.section === "body") {
          const status = data.cell.raw as string;
          if (status === "Paid") {
            doc.setFillColor(220, 252, 231); // Light green
          } else if (status === "Approved") {
            doc.setFillColor(254, 243, 199); // Light yellow
          } else if (status === "Pending") {
            doc.setFillColor(191, 219, 254); // Light blue
          } else if (status === "Rejected") {
            doc.setFillColor(254, 226, 226); // Light red
          }
        }
      },
      didDrawPage: (data) => {
        // Add page numbers
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

    // Save the PDF
    const fileName = `Invoices_${projectName.replace(/\s+/g, "_")}_${new Date().getTime()}.pdf`;
    doc.save(fileName);
  };

  // Toggle expanded invoice
  const toggleExpandInvoice = (invoiceId: string) => {
    setExpandedInvoiceId(expandedInvoiceId === invoiceId ? null : invoiceId);
  };

  // Calculate totals
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const approvedInvoices = invoices.filter((inv) => inv.status === "Approved");
  const paidInvoices = invoices.filter((inv) => inv.status === "Paid");
  const totalApproved = approvedInvoices.reduce(
    (sum, inv) => sum + inv.amount,
    0
  );
  const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const distinctVendors = Array.from(
    new Set(invoices.map((inv) => inv.vendor?.name).filter(Boolean))
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
          <div>
            <p className="text-xs font-semibold tracking-widest text-blue-600 uppercase mb-1">
              Vendor Invoices
            </p>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              Invoice Management
            </h1>
            <p className="text-slate-600 mt-2 text-sm lg:text-base">
              Track vendor invoices, approval status, and payment progress
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
                  Create Invoice
                </button>
                {invoices.length > 0 && (
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
            <FileText className="mx-auto mb-4 text-slate-400" size={48} />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No Project Selected
            </h3>
            <p className="text-slate-600">
              Please select a project from the dropdown above to view and manage
              invoices.
            </p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="rounded-2xl border border-blue-100 bg-white shadow-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="text-blue-600" size={18} />
                  <div className="text-xs font-semibold text-slate-500 uppercase">
                    Total Invoiced
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {formatCurrency(totalInvoiced)}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  All invoice amounts
                </div>
              </div>

              <div className="rounded-2xl border border-amber-100 bg-white shadow-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="text-amber-600" size={18} />
                  <div className="text-xs font-semibold text-slate-500 uppercase">
                    Approved
                  </div>
                </div>
                <div className="text-2xl font-bold text-amber-600">
                  {formatCurrency(totalApproved)}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {approvedInvoices.length} invoices approved
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-white shadow-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-xs font-semibold text-slate-500 uppercase">
                    Paid
                  </div>
                </div>
                <div className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(totalPaid)}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {paidInvoices.length} invoices paid
                </div>
              </div>

              <div className="rounded-2xl border border-purple-100 bg-white shadow-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="text-purple-600" size={18} />
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
                <option value="Paid">Paid</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {/* Invoices List */}
            <div className="mt-6">
              {loading ? (
                <p className="text-center text-slate-600 mt-6">Loading...</p>
              ) : invoices.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                  <p className="text-slate-600">
                    No invoices found. Create your first invoice to start
                    tracking vendor bills.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                    >
                      {/* Invoice Header - Clickable */}
                      <div
                        onClick={() => toggleExpandInvoice(invoice.id)}
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          {expandedInvoiceId === invoice.id ? (
                            <ChevronDown
                              size={20}
                              className="text-slate-400 flex-shrink-0"
                            />
                          ) : (
                            <ChevronRight
                              size={20}
                              className="text-slate-400 flex-shrink-0"
                            />
                          )}

                          <div className="flex items-center gap-6 flex-1">
                            <div>
                              <div className="text-xs text-slate-500 mb-1">
                                Invoice #
                              </div>
                              <div className="font-semibold text-blue-600">
                                {invoice.docNo}
                              </div>
                            </div>

                            <div>
                              <div className="text-xs text-slate-500 mb-1">
                                Vendor
                              </div>
                              <div className="font-medium text-slate-900">
                                {invoice.vendor?.name || "N/A"}
                              </div>
                            </div>

                            <div>
                              <div className="text-xs text-slate-500 mb-1">
                                Amount
                              </div>
                              <div className="font-semibold text-slate-900">
                                {formatCurrency(invoice.amount, invoice.po?.project?.baseCurrency)}
                              </div>
                            </div>

                            <div>
                              <div className="text-xs text-slate-500 mb-1">
                                Status
                              </div>
                              <div>
                                {invoice.status === "Paid" && (
                                  <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                                    Paid
                                  </span>
                                )}
                                {invoice.status === "Approved" && (
                                  <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                                    Approved
                                  </span>
                                )}
                                {invoice.status === "Pending" && (
                                  <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                    Pending
                                  </span>
                                )}
                                {invoice.status === "Rejected" && (
                                  <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                    Rejected
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedInvoiceId === invoice.id && (
                        <div className="border-t border-slate-200 bg-slate-50 p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                              <h4 className="text-sm font-semibold text-slate-700 mb-3">
                                Invoice Details
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-slate-600">
                                    Invoice Number:
                                  </span>
                                  <span className="font-medium">
                                    {invoice.docNo}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-600">
                                    PO Number:
                                  </span>
                                  <span className="font-medium">
                                    {invoice.po?.poNo || "N/A"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-600">
                                    Invoice Date:
                                  </span>
                                  <span className="font-medium">
                                    {invoice.date &&
                                    !isNaN(new Date(invoice.date).getTime())
                                      ? new Date(
                                          invoice.date
                                        ).toLocaleDateString()
                                      : "N/A"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-600">
                                    Due Date:
                                  </span>
                                  <span className="font-medium">
                                    {invoice.dueDate &&
                                    !isNaN(new Date(invoice.dueDate).getTime())
                                      ? new Date(
                                          invoice.dueDate
                                        ).toLocaleDateString()
                                      : "N/A"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-600">
                                    Created:
                                  </span>
                                  <span className="font-medium">
                                    {new Date(
                                      invoice.createdAt
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-semibold text-slate-700 mb-3">
                                Vendor Information
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-slate-600">
                                    Vendor Name:
                                  </span>
                                  <span className="font-medium">
                                    {invoice.vendor?.name || "N/A"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-600">
                                    Invoice Amount:
                                  </span>
                                  <span className="font-semibold text-lg">
                                    {formatCurrency(invoice.amount, invoice.po?.project?.baseCurrency)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-600">
                                    Current Status:
                                  </span>
                                  <span className="font-medium">
                                    {invoice.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {invoice.notes && (
                            <div className="mb-6">
                              <h4 className="text-sm font-semibold text-slate-700 mb-2">
                                Notes
                              </h4>
                              <p className="text-sm text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
                                {invoice.notes}
                              </p>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                            <div className="flex gap-2">
                              {invoice.status === "Pending" && (
                                <>
                                  <button
                                    onClick={() =>
                                      handleUpdateStatus(invoice.id, "Approved")
                                    }
                                    className="text-xs px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 font-semibold"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleUpdateStatus(invoice.id, "Rejected")
                                    }
                                    className="text-xs px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 font-semibold"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {invoice.status === "Approved" && (
                                <button
                                  onClick={() =>
                                    handleUpdateStatus(invoice.id, "Paid")
                                  }
                                  className="text-xs px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 font-semibold"
                                >
                                  Mark Paid
                                </button>
                              )}
                            </div>

                            <button
                              onClick={() => handleDeleteInvoice(invoice.id)}
                              className="text-xs px-4 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 font-semibold flex items-center gap-2"
                            >
                              <Trash2 size={14} />
                              Delete Invoice
                            </button>
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

        {/* Create Invoice Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Create Invoice</h2>
              <form
                onSubmit={handleCreateInvoice}
                className="space-y-4 text-sm"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Purchase Order *
                  </label>
                  <select
                    name="poId"
                    value={formData.poId}
                    onChange={handleFormChange}
                    required
                    className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm"
                  >
                    <option value="">-- Select Purchase Order --</option>
                    {purchaseOrders.map((po) => (
                      <option key={po.id} value={po.id}>
                        {po.poNo} - {po.vendor.name} (
                        {formatCurrency(po.amount, po.project?.baseCurrency)})
                      </option>
                    ))}
                  </select>
                </div>

                {poBalance && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-600">PO Amount:</span>
                      <span className="font-semibold">
                        {formatCurrency(poBalance.poAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-600">Already Invoiced:</span>
                      <span className="font-semibold">
                        {formatCurrency(poBalance.totalInvoiced)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Remaining:</span>
                      <span className="font-semibold text-emerald-600">
                        {formatCurrency(poBalance.remainingBalance)}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Amount *
                  </label>
                  <input
                    name="amount"
                    type="number"
                    value={formData.amount}
                    onChange={handleFormChange}
                    min={0}
                    step={0.01}
                    required
                    className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Currency: {projectCurrency}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Invoice Date *
                  </label>
                  <input
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleFormChange}
                    required
                    className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Due Date
                  </label>
                  <input
                    name="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={handleFormChange}
                    className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleFormChange}
                    rows={3}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Optional notes about this invoice"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setPOBalance(null);
                      setFormData({
                        poId: "",
                        amount: 0,
                        date: new Date().toISOString().split("T")[0]!,
                        dueDate: "",
                        notes: "",
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
                    Create Invoice
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
