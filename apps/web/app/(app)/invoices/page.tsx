"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

// Type declaration for Window
declare global {
  interface Window {
    allInvoices?: Invoice[];
  }
}

interface Invoice {
  id: string;
  docNo: string;
  vendorId: string;
  poId: string;
  date: string;
  amount: number;
  status: string;
  attachments?: any;  // Changed from notes to attachments
  createdAt: string;
  vendor?: {
    name: string;
    currency: string;
  };
  po?: {
    poNo: string;
    amount: number;
    project?: {
      id: string;
      title: string;
    };
  };
}

interface Vendor {
  id: string;
  name: string;
  currency: string;
}

interface Project {
  id: string;
  title: string;
}

interface PurchaseOrder {
  id: string;
  poNo: string;
  vendorId: string;
  projectId: string;
  amount: number;
  status: string;
}

interface InvoiceFormData {
  vendorId: string;
  poId: string;
  date: string;
  amount: number;
  // REMOVED notes field
}

interface POBalanceInfo {
  poAmount: number;
  totalInvoiced: number;
  remaining: number;
  existingInvoices: Array<{
    docNo: string;
    amount: number;
    status: string;
  }>;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [poBalanceInfo, setPoBalanceInfo] = useState<POBalanceInfo | null>(null);

  const [formData, setFormData] = useState<InvoiceFormData>({
    vendorId: "",
    poId: "",
    date: new Date().toISOString().split("T")[0] as string,
    amount: 0,
    // REMOVED notes: ""
  });

  useEffect(() => {
    fetchProjects();
    fetchVendors();
    fetchAllInvoices();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchInvoices();
      fetchPurchaseOrders();
    } else {
      fetchInvoices();
    }
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects?limit=999999`, {
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

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/invoices?limit=9999`;

      const response = await fetch(url, { credentials: "include" });
      const result = await response.json();
      if (result.success) {
        let filteredInvoices = result.data.invoices;
        if (selectedProjectId) {
          filteredInvoices = filteredInvoices.filter(
            (inv: Invoice) => inv.po?.project?.id === selectedProjectId
          );
        }
        setInvoices(filteredInvoices);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllInvoices = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/invoices?limit=9999`, {
        credentials: "include",
      });
      const result = await response.json();
      if (result.success) {
        window.allInvoices = result.data.invoices;
      }
    } catch (error) {
      console.error("Error fetching all invoices:", error);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/vendors`, {
        credentials: "include",
      });
      const result = await response.json();
      if (result.success) {
        setVendors(result.data.vendors);
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  const fetchPurchaseOrders = async () => {
    if (!selectedProjectId) {
      setPurchaseOrders([]);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/purchase-orders?status=Approved`,
        { credentials: "include" }
      );
      const result = await response.json();
      if (result.success) {
        setPurchaseOrders(result.data.purchaseOrders);
      }
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
      setPurchaseOrders([]);
    }
  };

  const fetchPOBalance = async (poId: string): Promise<POBalanceInfo | null> => {
    if (!poId) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/invoices/po/${poId}/balance`, {
        credentials: "include",
      });
      const result = await response.json();
      
      if (result.success) {
        return {
          poAmount: result.data.poAmount,
          totalInvoiced: result.data.totalInvoiced,
          remaining: result.data.remaining,
          existingInvoices: result.data.invoices.map((inv: any) => ({
            docNo: inv.docNo,
            amount: inv.amount,
            status: inv.status,
          })),
        };
      }
    } catch (error) {
      console.error("Error fetching PO balance:", error);
    }
    
    return null;
  };

  const handleCreateInvoice = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (poBalanceInfo && formData.amount > poBalanceInfo.remaining) {
      alert(
        `❌ Invoice amount cannot exceed remaining PO balance!\n\n` +
        `PO Amount: ${poBalanceInfo.poAmount.toLocaleString()}\n` +
        `Already Invoiced: ${poBalanceInfo.totalInvoiced.toLocaleString()}\n` +
        `Remaining Available: ${poBalanceInfo.remaining.toLocaleString()}\n\n` +
        `You can only invoice up to ${poBalanceInfo.remaining.toLocaleString()}`
      );
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (result.success) {
        alert("✅ Invoice created successfully");
        setShowCreateModal(false);
        setFormData({
          vendorId: "",
          poId: "",
          date: new Date().toISOString().split("T")[0] as string,
          amount: 0,
        });
        setSelectedVendorId("");
        setPoBalanceInfo(null);
        fetchInvoices();
        fetchAllInvoices();
      } else {
        alert(result.message || "Failed to create invoice");
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      alert("Failed to create invoice");
    }
  };

  const handleUpdateStatus = async (invoiceId: string, status: string) => {
    if (!confirm(`Are you sure you want to mark this invoice as ${status}?`))
      return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/invoices/${invoiceId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status }),
        }
      );

      const result = await response.json();
      if (result.success) {
        alert(`Invoice ${status.toLowerCase()} successfully`);
        fetchInvoices();
        fetchAllInvoices();
      } else {
        alert(result.message || "Failed to update invoice");
      }
    } catch (error) {
      console.error("Error updating invoice:", error);
      alert("Failed to update invoice");
    }
  };

  const handleDelete = async (invoiceId: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/invoices/${invoiceId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const result = await response.json();
      if (result.success) {
        alert("Invoice deleted successfully");
        fetchInvoices();
        fetchAllInvoices();
      } else {
        alert(result.message || "Failed to delete invoice");
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
      alert("Failed to delete invoice");
    }
  };

  // FIXED PDF GENERATION (removed notes section)
  const generateInvoicePDF = async (invoice: Invoice) => {
    try {
      // Fetch PO balance info
      let poBalance: POBalanceInfo | null = null;
      if (invoice.poId) {
        poBalance = await fetchPOBalance(invoice.poId);
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Colors
      const colors = {
        primary: [37, 99, 235] as [number, number, number],
        success: [22, 163, 74] as [number, number, number],
        warning: [234, 88, 12] as [number, number, number],
        danger: [220, 38, 38] as [number, number, number],
        text: [30, 41, 59] as [number, number, number],
        lightText: [100, 116, 139] as [number, number, number],
        lightBg: [248, 250, 252] as [number, number, number],
        border: [226, 232, 240] as [number, number, number],
      };

      // Helper function for status color
      const getStatusColor = (status: string): [number, number, number] => {
        switch (status.toLowerCase()) {
          case "approved": return colors.success;
          case "pending": return colors.warning;
          case "rejected": return colors.danger;
          default: return colors.lightText;
        }
      };

      // ========== HEADER ==========
      doc.setFillColor(...colors.primary);
      doc.rect(0, 0, pageWidth, 50, "F");

      // Logo/Icon
      doc.setFontSize(28);
      doc.setTextColor(255, 255, 255);
      doc.text("📽️", 15, 22);

      // Title
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("INVOICE", 35, 22);

      // Subtitle
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Film Finance Management System", 35, 30);
      doc.setFontSize(8);
      doc.text("Professional Invoice & Payment Tracking", 35, 37);

      // Invoice number (right side)
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Invoice No:", pageWidth - 15, 18, { align: "right" });
      
      doc.setFontSize(14);
      doc.text(invoice.docNo, pageWidth - 15, 26, { align: "right" });

      // Status badge
      const statusColor = getStatusColor(invoice.status);
      doc.setFillColor(...statusColor);
      doc.roundedRect(pageWidth - 50, 32, 35, 8, 2, 2, "F");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text(invoice.status.toUpperCase(), pageWidth - 32.5, 37, { align: "center" });

      // Reset text color
      doc.setTextColor(...colors.text);

      // ========== INVOICE INFO CARDS ==========
      let yPos = 60;

      // Left Card - Invoice Details
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.5);
      doc.roundedRect(15, yPos, 90, 50, 3, 3, "S");

      // Card header
      doc.setFillColor(...colors.lightBg);
      doc.roundedRect(15, yPos, 90, 12, 3, 3, "F");

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.primary);
      doc.text("INVOICE DETAILS", 20, yPos + 8);

      // Date
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colors.lightText);
      doc.text("Invoice Date:", 20, yPos + 22);

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.text);
      const formattedDate = new Date(invoice.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      doc.text(formattedDate, 20, yPos + 30);

      // Project info
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colors.lightText);
      doc.text("Project:", 20, yPos + 40);

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.text);
      const projectText = invoice.po?.project?.title || "N/A";
      doc.text(projectText.substring(0, 25), 20, yPos + 47);

      // Right Card - Vendor Info
      doc.setDrawColor(...colors.border);
      doc.roundedRect(110, yPos, 85, 50, 3, 3, "S");

      // Card header
      doc.setFillColor(...colors.lightBg);
      doc.roundedRect(110, yPos, 85, 12, 3, 3, "F");

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.primary);
      doc.text("VENDOR", 115, yPos + 8);

      // Vendor name
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.text);
      doc.text(invoice.vendor?.name || "N/A", 115, yPos + 24);

      // PO Number
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colors.lightText);
      doc.text("Purchase Order:", 115, yPos + 35);

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.text);
      doc.text(invoice.po?.poNo || "N/A", 115, yPos + 42);

      yPos += 60;

      // ========== INVOICE AMOUNT (BIG HIGHLIGHT) ==========
      doc.setFillColor(...colors.success);
      doc.roundedRect(15, yPos, pageWidth - 30, 25, 3, 3, "F");

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("INVOICE AMOUNT", 20, yPos + 10);

      doc.setFontSize(20);
      const currency = invoice.vendor?.currency || "USD";
      const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "Rs.";
      doc.text(`${symbol}${invoice.amount.toLocaleString()}`, 20, yPos + 20);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Currency: ${currency}`, pageWidth - 20, yPos + 20, { align: "right" });

      yPos += 35;

      // ========== PO BALANCE (IF AVAILABLE) ==========
      if (poBalance) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...colors.primary);
        doc.text("PURCHASE ORDER BALANCE", 15, yPos);

        yPos += 8;

        // PO Balance boxes
        const boxWidth = (pageWidth - 40) / 3;
        
        // PO Amount
        doc.setFillColor(...colors.lightBg);
        doc.setDrawColor(...colors.border);
        doc.roundedRect(15, yPos, boxWidth, 22, 2, 2, "FD");
        
        doc.setFontSize(8);
        doc.setTextColor(...colors.lightText);
        doc.text("PO Amount", 17, yPos + 6);
        
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...colors.text);
        doc.text(`${symbol}${poBalance.poAmount.toLocaleString()}`, 17, yPos + 15);

        // Already Invoiced
        doc.setFillColor(254, 243, 199); // Light orange
        doc.setDrawColor(251, 191, 36); // Orange
        doc.roundedRect(15 + boxWidth + 5, yPos, boxWidth, 22, 2, 2, "FD");
        
        doc.setFontSize(8);
        doc.setTextColor(...colors.lightText);
        doc.text("Already Invoiced", 17 + boxWidth + 5, yPos + 6);
        
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(180, 83, 9); // Dark orange
        doc.text(`${symbol}${poBalance.totalInvoiced.toLocaleString()}`, 17 + boxWidth + 5, yPos + 15);

        // Remaining
        doc.setFillColor(220, 252, 231); // Light green
        doc.setDrawColor(34, 197, 94); // Green
        doc.roundedRect(15 + (boxWidth + 5) * 2, yPos, boxWidth, 22, 2, 2, "FD");
        
        doc.setFontSize(8);
        doc.setTextColor(...colors.lightText);
        doc.text("Remaining", 17 + (boxWidth + 5) * 2, yPos + 6);
        
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...colors.success);
        doc.text(`${symbol}${poBalance.remaining.toLocaleString()}`, 17 + (boxWidth + 5) * 2, yPos + 15);

        yPos += 30;

        // Existing invoices table (if any)
        if (poBalance.existingInvoices.length > 0) {
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...colors.text);
          doc.text("Existing Invoices:", 15, yPos);

          yPos += 5;

          // Use autoTable correctly
          autoTable(doc, {
            startY: yPos,
            head: [["Invoice No", "Amount", "Status"]],
            body: poBalance.existingInvoices.map((inv) => [
              inv.docNo,
              `${symbol}${inv.amount.toLocaleString()}`,
              inv.status,
            ]),
            theme: "grid",
            headStyles: {
              fillColor: colors.primary,
              fontSize: 9,
              fontStyle: "bold",
            },
            bodyStyles: {
              fontSize: 8,
            },
            margin: { left: 15, right: 15 },
            tableWidth: pageWidth - 30,
          });

          yPos = (doc as any).lastAutoTable.finalY + 10;
        }
      }

      // ========== FOOTER ==========
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.5);
      doc.line(15, pageHeight - 25, pageWidth - 15, pageHeight - 25);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colors.lightText);
      doc.text(
        "This is an automatically generated invoice. For inquiries, contact your production manager.",
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

      // Save PDF
      doc.save(`Invoice-${invoice.docNo}-${Date.now()}.pdf`);
      alert("✅ Invoice PDF generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("❌ Failed to generate PDF. Please try again.");
    }
  };

  const handleDownloadPDF = async (invoiceId: string) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (!invoice) {
      alert("Invoice not found");
      return;
    }

    await generateInvoicePDF(invoice);
  };

  const handleFormChange = async (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "amount") {
      setFormData((prev) => ({ ...prev, [name]: Number(value) }));
    } else if (name === "vendorId") {
      setSelectedVendorId(value);
      setFormData((prev) => ({ ...prev, vendorId: value, poId: "" }));
      setPoBalanceInfo(null);
    } else if (name === "poId") {
      const selectedPO = purchaseOrders.find((po) => po.id === value);
      
      // Fetch balance from backend
      const balance = await fetchPOBalance(value);
      setPoBalanceInfo(balance);

      setFormData((prev) => ({
        ...prev,
        poId: value,
        amount: balance?.remaining || selectedPO?.amount || 0,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleProjectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedProjectId(e.target.value);
  };

  const handleOpenCreateModal = () => {
    if (!selectedProjectId) {
      alert("Please select a project first");
      return;
    }
    setShowCreateModal(true);
  };

  const filteredPOs = selectedVendorId
    ? purchaseOrders.filter((po) => po.vendorId === selectedVendorId)
    : purchaseOrders;

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const pendingCount = invoices.filter((i) => i.status === "Pending").length;
  const approvedCount = invoices.filter((i) => i.status === "Approved").length;

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Invoices</h1>
            <p className="text-slate-600">
              Track vendor invoices, statuses, and payment readiness.
            </p>
            {selectedProject && (
              <p className="text-sm text-indigo-600 font-semibold mt-1">
                Project: {selectedProject.title}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            disabled={Boolean(!selectedProjectId)}
            className="px-4 h-10 rounded-lg bg-indigo-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-sm hover:bg-indigo-700"
          >
            Create New Invoice
          </button>
        </div>

        {/* Project Filter */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-4 mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Filter by Project
          </label>
          <select
            value={selectedProjectId}
            onChange={handleProjectChange}
            className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">-- All Projects --</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </div>

        {/* Summary cards */}
        {invoices.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
              <div className="text-xs text-slate-500 mb-1">Total Invoices</div>
              <div className="text-2xl font-bold text-slate-900">
                {invoices.length}
              </div>
            </div>
            <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
              <div className="text-xs text-slate-500 mb-1">Total Amount</div>
              <div className="text-2xl font-bold text-slate-900">
                ${totalAmount.toLocaleString()}
              </div>
            </div>
            <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
              <div className="text-xs text-slate-500 mb-1">Pending</div>
              <div className="text-2xl font-bold text-amber-600">
                {pendingCount}
              </div>
            </div>
            <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
              <div className="text-xs text-slate-500 mb-1">Approved</div>
              <div className="text-2xl font-bold text-emerald-600">
                {approvedCount}
              </div>
            </div>
          </div>
        )}

        {/* Create Invoice Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Create Invoice</h2>
              <form onSubmit={handleCreateInvoice} className="space-y-4 text-sm">
                {/* Vendor Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Vendor *
                  </label>
                  <select
                    name="vendorId"
                    value={formData.vendorId}
                    onChange={handleFormChange}
                    required
                    className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm"
                  >
                    <option value="">-- Select Vendor --</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Purchase Order Selection (REQUIRED) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Purchase Order *
                  </label>
                  <select
                    name="poId"
                    value={formData.poId}
                    onChange={handleFormChange}
                    required
                    disabled={Boolean(!selectedVendorId)}
                    className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm disabled:bg-slate-100"
                  >
                    <option value="">-- Select Purchase Order --</option>
                    {filteredPOs.map((po) => (
                      <option key={po.id} value={po.id}>
                        {po.poNo} - ${po.amount.toLocaleString()}
                      </option>
                    ))}
                  </select>
                  {!selectedVendorId && (
                    <p className="text-xs text-slate-400 mt-1">
                      Select a vendor first
                    </p>
                  )}
                  {selectedVendorId && filteredPOs.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      No approved POs found for this vendor in the selected project
                    </p>
                  )}
                </div>

                {/* PO Balance Information */}
                {poBalanceInfo && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-indigo-300 rounded-xl p-4 space-y-3">
                    <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                      <span className="text-lg">💰</span> Purchase Order Balance
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-white rounded-lg p-2">
                        <span className="text-slate-500 block mb-1">PO Amount:</span>
                        <p className="font-bold text-slate-900 text-base">
                          ${poBalanceInfo.poAmount.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-2">
                        <span className="text-slate-500 block mb-1">Already Invoiced:</span>
                        <p className="font-bold text-orange-600 text-base">
                          ${poBalanceInfo.totalInvoiced.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="bg-green-100 border-2 border-green-400 rounded-lg p-3">
                      <span className="text-green-700 text-xs block mb-1">
                        💵 Available to Invoice:
                      </span>
                      <p className="font-bold text-green-700 text-2xl">
                        ${poBalanceInfo.remaining.toLocaleString()}
                      </p>
                    </div>

                    {poBalanceInfo.existingInvoices.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-indigo-200">
                        <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                          <span>📋</span> Existing Invoices:
                        </p>
                        <div className="space-y-1 max-h-24 overflow-y-auto">
                          {poBalanceInfo.existingInvoices.map((inv, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between text-xs bg-white rounded px-2 py-1"
                            >
                              <span className="text-slate-700">
                                {inv.docNo} 
                                <span className={`ml-1 text-xs ${
                                  inv.status === 'Approved' ? 'text-green-600' : 
                                  inv.status === 'Pending' ? 'text-amber-600' : 
                                  'text-slate-500'
                                }`}>
                                  ({inv.status})
                                </span>
                              </span>
                              <span className="font-semibold text-slate-900">
                                ${inv.amount.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Invoice Date */}
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

                {/* Amount with validation indicator */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Amount *
                  </label>
                  <input
                    name="amount"
                    type="number"
                    value={formData.amount}
                    onChange={handleFormChange}
                    min="0"
                    step="0.01"
                    required
                    className={`w-full h-10 border-2 rounded-lg px-3 text-sm font-semibold ${
                      poBalanceInfo && formData.amount > poBalanceInfo.remaining
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-slate-300"
                    }`}
                  />
                  {poBalanceInfo && formData.amount > poBalanceInfo.remaining && (
                    <div className="mt-2 p-2 bg-red-100 border border-red-400 rounded-lg">
                      <p className="text-xs text-red-700 font-bold flex items-center gap-1">
                        <span>⚠️</span> Amount exceeds available balance!
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        Maximum allowed: ${poBalanceInfo.remaining.toLocaleString()}
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    Auto-filled with remaining balance from PO
                  </p>
                </div>

                {/* REMOVED NOTES FIELD */}

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setPoBalanceInfo(null);
                    }}
                    className="px-4 h-9 rounded-lg border border-slate-300 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={Boolean(poBalanceInfo && formData.amount > poBalanceInfo.remaining)}
                    className="px-4 h-9 rounded-lg bg-indigo-600 text-white text-sm font-semibold disabled:bg-slate-300 disabled:cursor-not-allowed"
                  >
                    Create Invoice
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Invoices Table */}
        <div className="mt-4">
          {loading ? (
            <p className="text-center text-slate-600 mt-6">Loading...</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Invoice Number</th>
                    <th className="px-4 py-2 text-left">Vendor</th>
                    <th className="px-4 py-2 text-left">PO Number</th>
                    <th className="px-4 py-2 text-left">Project</th>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-right">Amount</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-8 text-center text-slate-600"
                      >
                        No invoices found.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((invoice) => (
                      <tr
                        key={invoice.id}
                        className="border-t hover:bg-slate-50"
                      >
                        <td className="px-4 py-2 font-semibold">
                          {invoice.docNo}
                        </td>
                        <td className="px-4 py-2">
                          {invoice.vendor?.name || "N/A"}
                        </td>
                        <td className="px-4 py-2">
                          {invoice.po?.poNo || "N/A"}
                        </td>
                        <td className="px-4 py-2">
                          {invoice.po?.project?.title || "N/A"}
                        </td>
                        <td className="px-4 py-2">
                          {new Date(invoice.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 text-right">
                          ${invoice.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-2">
                          {invoice.status === "Pending" && (
                            <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                              Pending
                            </span>
                          )}
                          {invoice.status === "Approved" && (
                            <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                              Approved
                            </span>
                          )}
                          {invoice.status === "Rejected" && (
                            <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                              Rejected
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex flex-wrap gap-2">
                            {invoice.status === "Pending" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateStatus(invoice.id, "Approved")
                                  }
                                  className="px-3 h-8 rounded-md border border-emerald-300 text-xs text-emerald-700 hover:bg-emerald-50"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateStatus(invoice.id, "Rejected")
                                  }
                                  className="px-3 h-8 rounded-md border border-amber-300 text-xs text-amber-700 hover:bg-amber-50"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDownloadPDF(invoice.id)}
                              className="px-3 h-8 rounded-md border border-blue-300 text-xs text-blue-700 hover:bg-blue-50"
                              title="Download PDF"
                            >
                              📄 PDF
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(invoice.id)}
                              className="px-3 h-8 rounded-md border border-red-300 text-xs text-red-600 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
