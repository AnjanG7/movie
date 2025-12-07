'use client';

import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download } from 'lucide-react';

const exportPOToPDF = (po: any) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text('Purchase Order', 14, 20);
  
  doc.setFontSize(11);
  doc.text(`PO Number: ${po.poNumber}`, 14, 35);
  doc.text(`Date: ${new Date(po.poDate).toLocaleDateString()}`, 14, 41);
  doc.text(`Vendor: ${po.vendor?.name || 'N/A'}`, 14, 47);
  doc.text(`Status: ${po.status}`, 14, 53);

  // Line Items
  if (po.lineItems && po.lineItems.length > 0) {
    doc.setFontSize(14);
    doc.text('Items', 14, 65);

    const itemData = po.lineItems.map((item: any) => [
      item.description,
      item.qty.toString(),
      item.unitPrice.toLocaleString(),
      (item.qty * item.unitPrice).toLocaleString()
    ]);

    autoTable(doc, {
      startY: 70,
      head: [['Description', 'Qty', 'Unit Price', 'Total']],
      body: itemData,
      theme: 'striped',
      headStyles: { fillColor: [249, 115, 22] },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' }
      }
    });

    // Total
    const total = po.lineItems.reduce((sum: number, item: any) => sum + (item.qty * item.unitPrice), 0);
    const finalY = (doc as any).lastAutoTable.finalY + 5;
    doc.setFontSize(12);
    doc.setFont("Helvetica", 'bold');
    doc.text(`Total: ${total.toLocaleString()}`, 14, finalY);
  }

  // Notes
  if (po.notes) {
    const notesY = (doc as any).lastAutoTable?.finalY + 15 || 120;
    doc.setFontSize(10);
    doc.text('Notes:', 14, notesY);
    doc.setFont("Helvetica", 'normal');
    doc.text(po.notes, 14, notesY + 6, { maxWidth: 180 });
  }

  // Save
  const filename = `PO_${po.poNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};

// Client Component that uses useSearchParams
function PurchaseOrdersContent() {
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get('projectId');

  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [budgetLines, setBudgetLines] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(projectIdParam || '');
  const [formData, setFormData] = useState<any>({
    vendorId: '',
    amount: 0,
    notes: '',
    budgetLineId: '',
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
        alert('Purchase Order created successfully');
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
        `${API_BASE_URL}/projects/${selectedProjectId}/purchase-orders/${poId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status }),
        }
      );

      const result = await response.json();
      if (result.success) {
        alert(`PO ${status.toLowerCase()}d successfully`);
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
        alert('PO deleted successfully');
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
                          <td className="px-6 py-4 text-right space-x-2">
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
                              onClick={() => handleDelete(po.id)}
                              className="px-3 py-1.5 rounded-md border border-red-300 text-xs text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                            >
                              Delete
                            </button>
                            <button
                            onClick={() => exportPOToPDF(po)}
                            className="text-green-600 hover:text-green-900"
                          >
                            <Download className="w-4 h-4" />
                          </button>

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
                    Budget Line
                  </label>
                  <select
                    name="budgetLineId"
                    value={formData.budgetLineId}
                    onChange={handleFormChange}
                    className="w-full h-11 border border-slate-300 rounded-lg px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Select Budget Line (Optional) --</option>
                    {budgetLines.map((line: any) => (
                      <option key={line.id} value={line.id}>
                        {line.phase} - {line.name} (Remaining: {line.remaining?.toFixed(2) || 0})
                      </option>
                    ))}
                  </select>
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
                    className="flex-1 h-11 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all font-semibold"
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

// Server Component wrapper with Suspense
export default function PurchaseOrdersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading Purchase Orders...</p>
        </div>
      </div>
    }>
      <PurchaseOrdersContent />
    </Suspense>
  );
}
