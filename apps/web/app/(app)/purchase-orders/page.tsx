'use client';

import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Professional PDF Export Function (matching Invoice style)
const exportPOToPDF = async (po: any) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Colors
    const colors = {
      primary: [59, 130, 246] as [number, number, number], // Blue-500
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
    doc.text("📋", 15, 22);

    // Title
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("PURCHASE ORDER", 35, 22);

    // Subtitle
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Film Finance Management System", 35, 30);
    doc.setFontSize(8);
    doc.text("Professional Procurement & Budget Management", 35, 37);

    // PO number (right side)
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("PO No:", pageWidth - 15, 18, { align: "right" });
    
    doc.setFontSize(14);
    doc.text(po.poNo, pageWidth - 15, 26, { align: "right" });

    // Status badge
    const statusColor = getStatusColor(po.status);
    doc.setFillColor(...statusColor);
    doc.roundedRect(pageWidth - 50, 32, 35, 8, 2, 2, "F");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(po.status.toUpperCase(), pageWidth - 32.5, 37, { align: "center" });

    // Reset text color
    doc.setTextColor(...colors.text);

    // ========== PO INFO CARDS ==========
    let yPos = 60;

    // Left Card - PO Details
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.5);
    doc.roundedRect(15, yPos, 90, 50, 3, 3, "S");

    // Card header
    doc.setFillColor(...colors.lightBg);
    doc.roundedRect(15, yPos, 90, 12, 3, 3, "F");

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.primary);
    doc.text("ORDER DETAILS", 20, yPos + 8);

    // Date
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.lightText);
    doc.text("Order Date:", 20, yPos + 22);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.text);
    const formattedDate = new Date(po.createdAt).toLocaleDateString("en-US", {
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
    const projectText = po.project?.title || "N/A";
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
    doc.text(po.vendor?.name || "N/A", 115, yPos + 24);

    // Currency
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.lightText);
    doc.text("Currency:", 115, yPos + 35);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.text);
    doc.text(po.vendor?.currency || "USD", 115, yPos + 42);

    yPos += 60;

    // ========== PO AMOUNT (BIG HIGHLIGHT) ==========
    doc.setFillColor(...colors.primary);
    doc.roundedRect(15, yPos, pageWidth - 30, 25, 3, 3, "F");

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("PURCHASE ORDER AMOUNT", 20, yPos + 10);

    doc.setFontSize(20);
    const currency = po.vendor?.currency || "USD";
    const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "Rs.";
    doc.text(`${symbol}${po.amount.toLocaleString()}`, 20, yPos + 20);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Currency: ${currency}`, pageWidth - 20, yPos + 20, { align: "right" });

    yPos += 35;

    // ========== BUDGET LINE INFORMATION ==========
    if (po.budgetLine) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.primary);
      doc.text("BUDGET LINE ALLOCATION", 15, yPos);

      yPos += 8;

      // Budget line details box
      doc.setFillColor(...colors.lightBg);
      doc.setDrawColor(...colors.border);
      doc.roundedRect(15, yPos, pageWidth - 30, 30, 2, 2, "FD");

      doc.setFontSize(9);
      doc.setTextColor(...colors.lightText);
      doc.text("Phase:", 20, yPos + 8);
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.text);
      doc.text(po.budgetLine.phase, 20, yPos + 14);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colors.lightText);
      doc.text("Budget Line:", 20, yPos + 22);
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.text);
      doc.text(po.budgetLine.name || "N/A", 20, yPos + 28);

      // Budget Amount
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colors.lightText);
      doc.text("Budgeted Amount:", pageWidth - 20, yPos + 8, { align: "right" });
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.text);
      const budgetedAmount = (po.budgetLine.qty || 0) * (po.budgetLine.rate || 0);
      doc.text(`${symbol}${budgetedAmount.toLocaleString()}`, pageWidth - 20, yPos + 14, { align: "right" });

      yPos += 38;
    }

    // ========== NOTES ==========
    if (po.notes) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.primary);
      doc.text("NOTES", 15, yPos);

      yPos += 8;

      doc.setFillColor(...colors.lightBg);
      doc.setDrawColor(...colors.border);
      doc.roundedRect(15, yPos, pageWidth - 30, 25, 2, 2, "FD");

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colors.text);
      const splitNotes = doc.splitTextToSize(po.notes, pageWidth - 40);
      doc.text(splitNotes, 20, yPos + 8);

      yPos += 33;
    }

    // ========== APPROVAL INFO ==========
    if (po.approvedBy || po.approvedAt) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.primary);
      doc.text("APPROVAL DETAILS", 15, yPos);

      yPos += 8;

      doc.setFillColor(220, 252, 231); // Light green
      doc.setDrawColor(34, 197, 94); // Green
      doc.roundedRect(15, yPos, pageWidth - 30, 20, 2, 2, "FD");

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colors.text);
      
      if (po.approvedAt) {
        const approvalDate = new Date(po.approvedAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: '2-digit',
          minute: '2-digit'
        });
        doc.text(`Approved on: ${approvalDate}`, 20, yPos + 10);
        doc.text(`Approved by: ${po.approvedBy}`, 20, yPos + 16);
      }

      if (po.approvedBy) {
      }

      yPos += 28;
    }

    // ========== FOOTER ==========
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.5);
    doc.line(15, pageHeight - 25, pageWidth - 15, pageHeight - 25);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.lightText);
    doc.text(
      "This is an automatically generated purchase order. For inquiries, contact your production manager.",
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
    doc.save(`PurchaseOrder-${po.poNo}-${Date.now()}.pdf`);
    alert("✅ Purchase Order PDF generated successfully!");
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("❌ Failed to generate PDF. Please try again.");
  }
};

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [budgetLines, setBudgetLines] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [formData, setFormData] = useState<any>({
    vendorId: '',
    amount: 0,
    notes: '',
    budgetLineId: '', // Now required
  });

  useEffect(() => {
    fetchProjects();
    fetchVendors();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchPurchaseOrders();
      fetchBudgetLines();
    }
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects?limit=999999`, {
        credentials: 'include',
      });
      const result = await response.json();
      if (result.success) {
        setProjects(result.data.projects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/vendors`, {
        credentials: 'include',
      });
      const result = await response.json();
      if (result.success) {
        setVendors(result.data.vendors);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const fetchBudgetLines = async () => {
    if (!selectedProjectId) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/budget-lines`,
        { credentials: 'include' }
      );
      const result = await response.json();
      if (result.success) {
        setBudgetLines(result.data.lines || []);
      }
    } catch (error) {
      console.error('Error fetching budget lines:', error);
      setBudgetLines([]);
    }
  };

  const fetchPurchaseOrders = async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/purchase-orders`,
        { credentials: 'include' }
      );
      const result = await response.json();
      if (result.success) {
        setPurchaseOrders(result.data.purchaseOrders || []);
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePO = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProjectId) {
      alert('Please select a project');
      return;
    }

    // Validate budget line is selected
    if (!formData.budgetLineId) {
      alert('⚠️ Budget Line is required. Please select a budget line.');
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/purchase-orders`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();
      if (result.success) {
        alert('✅ Purchase Order created successfully');
        setShowCreateModal(false);
        setFormData({ vendorId: '', amount: 0, notes: '', budgetLineId: '' });
        fetchPurchaseOrders();
        fetchBudgetLines();
      } else {
        alert(result.message || 'Failed to create PO');
      }
    } catch (error) {
      console.error('Error creating PO:', error);
      alert('Failed to create PO');
    }
  };

  const handleUpdateStatus = async (poId: string, status: string) => {
    if (!confirm(`Are you sure you want to ${status.toLowerCase()} this PO?`)) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/purchase-orders/${poId}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status }),
        }
      );

      const result = await response.json();
      if (result.success) {
        alert(`✅ PO ${status.toLowerCase()}d successfully`);
        fetchPurchaseOrders();
        fetchBudgetLines();
      } else {
        alert(result.message || 'Failed to update PO');
      }
    } catch (error) {
      console.error('Error updating PO:', error);
      alert('Failed to update PO');
    }
  };

  const handleDelete = async (poId: string) => {
    if (!confirm('Are you sure you want to delete this PO?')) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/purchase-orders/${poId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      const result = await response.json();
      if (result.success) {
        alert('✅ PO deleted successfully');
        fetchPurchaseOrders();
        fetchBudgetLines();
      } else {
        alert(result.message || 'Failed to delete PO');
      }
    } catch (error) {
      console.error('Error deleting PO:', error);
      alert('Failed to delete PO');
    }
  };

  const handleProjectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedProjectId(e.target.value);
  };

  const handleFormChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'amount') {
      setFormData((prev: any) => ({ ...prev, [name]: Number(value) || 0 }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const selectedProject = projects.find((p: any) => p.id === selectedProjectId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Purchase Orders</h1>
            <p className="text-slate-600">
              Create and manage POs linked to your budget lines.
            </p>
          </div>
          {selectedProject && (
            <div className="px-4 py-2 rounded-xl bg-white/70 border border-slate-200 text-sm text-slate-700 shadow-sm">
              <div className="font-semibold">{selectedProject.title}</div>
            </div>
          )}
        </div>

        {/* Project Selector */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Select Project
          </label>
          <select
            value={selectedProjectId}
            onChange={handleProjectChange}
            className="w-full max-w-md h-10 border border-slate-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">-- Select a Project --</option>
            {projects.map((project: any) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </div>

        {/* Create Button */}
        {selectedProjectId && (
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-5 h-10 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
            >
              + Create Purchase Order
            </button>
          </div>
        )}

        {/* Purchase Orders Table */}
        {selectedProjectId && (
          <div className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        PO Number
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Vendor
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Budget Line
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {purchaseOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                          <div className="flex flex-col items-center space-y-2">
                            <svg className="w-12 h-12 text-slate-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h4z" />
                            </svg>
                            <p className="text-lg font-medium text-slate-900">No purchase orders</p>
                            <p className="text-sm text-slate-500">Create your first purchase order to get started.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      purchaseOrders.map((po: any) => (
                        <tr key={po.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-900">{po.poNo}</td>
                          <td className="px-6 py-4">
                            <span className="font-medium text-slate-900">{po.vendor?.name || 'N/A'}</span>
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-slate-900">
                            {po.vendor?.currency || 'USD'} {po.amount?.toLocaleString() || '0'}
                          </td>
                          <td className="px-6 py-4">
                            {po.budgetLine ? (
                              <span className="text-sm text-slate-900">
                                {po.budgetLine.phase} - {po.budgetLine.name}
                              </span>
                            ) : (
                              <span className="text-sm text-slate-400 font-medium">Not linked</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              po.status === 'Approved' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : po.status === 'Rejected' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {po.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">
                            {po.createdAt ? new Date(po.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {po.status === 'Pending' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(po.id, 'Approved')}
                                    className="px-3 py-1.5 rounded-md border border-emerald-300 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(po.id, 'Rejected')}
                                    className="px-3 py-1.5 rounded-md border border-amber-300 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              <button
                                type="button"
                                onClick={() => exportPOToPDF(po)}
                                className="px-3 py-1.5 rounded-md border-2 border-blue-400 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-1 font-semibold"
                                title="Download PDF"
                              >
                                📄 PDF
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(po.id)}
                                className="px-3 py-1.5 rounded-md border border-red-300 text-xs text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
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
        )}

        {/* Create PO Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900">Create Purchase Order</h2>
              </div>
              <form onSubmit={handleCreatePO} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                    Vendor *
                  </label>
                  <select
                    name="vendorId"
                    value={formData.vendorId}
                    onChange={handleFormChange}
                    required
                    className="w-full h-11 border border-slate-300 rounded-lg px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Select Vendor --</option>
                    {vendors.map((vendor: any) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name} ({vendor.currency})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                    Budget Line * <span className="text-red-600">(Required)</span>
                  </label>
                  <select
                    name="budgetLineId"
                    value={formData.budgetLineId}
                    onChange={handleFormChange}
                    required
                    className="w-full h-11 border-2 border-blue-300 rounded-lg px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50"
                  >
                    <option value="">-- Select Budget Line --</option>
                    {budgetLines.map((line: any) => (
                      <option key={line.id} value={line.id}>
                        {line.phase} - {line.name} (Remaining: {line.remaining?.toFixed(2) || 0})
                      </option>
                    ))}
                  </select>
                  {budgetLines.length === 0 && (
                    <p className="text-xs text-amber-600 mt-2">
                      ⚠️ No budget lines available for this project. Please create budget lines first.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
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
                    className="w-full h-11 border border-slate-300 rounded-lg px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleFormChange}
                    rows={3}
                    className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                    placeholder="Additional notes or description..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 h-11 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!formData.budgetLineId}
                    className="flex-1 h-11 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all font-semibold disabled:bg-slate-300 disabled:cursor-not-allowed"
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
