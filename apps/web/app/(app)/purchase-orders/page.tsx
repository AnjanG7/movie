'use client';

export const dynamic = "force-dynamic";

import React, {
  useState,
  useEffect,
  FormEvent,
  ChangeEvent,
} from 'react';
import { useSearchParams } from 'next/navigation';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface PurchaseOrder {
  id: string;
  poNo: string;
  projectId: string;
  vendorId: string;
  amount: number;
  status: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  budgetLineId?: string;
  vendor?: {
    name: string;
    currency: string;
  };
  project?: {
    title: string;
  };
  budgetLine?: {
    name: string;
    phase: string;
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

interface BudgetLine {
  id: string;
  name: string;
  phase: string;
  department: string | null;
  budgeted: number;
  committed: number;
  spent: number;
  remaining: number;
}

interface POFormData {
  vendorId: string;
  amount: number;
  notes: string;
  budgetLineId: string;
}

export default function PurchaseOrdersPage() {
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get('projectId');

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [selectedProjectId, setSelectedProjectId] = useState(
    projectIdParam || ''
  );

  const [formData, setFormData] = useState<POFormData>({
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
        setProjects(result.data.projects || []);
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
        setVendors(result.data.vendors || []);
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
    if (!confirm(`Are you sure you want to ${status.toLowerCase()} this PO?`))
      return;

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
        alert(`PO ${status.toLowerCase()} successfully`);
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
      setFormData((prev) => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Purchase Orders
            </h1>
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

        {/* Project selector and create button */}
        <div className="bg-white/80 rounded-2xl border border-slate-200 shadow-md p-4 mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-slate-700">
              Select Project
            </label>
            <select
              value={selectedProjectId}
              onChange={handleProjectChange}
              className="h-10 min-w-[220px] rounded-lg border border-slate-300 px-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Project --</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            disabled={!selectedProjectId}
            onClick={() => setShowCreateModal(true)}
            className="ml-auto px-4 h-10 rounded-lg bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold"
          >
            Create New PO
          </button>
        </div>

        {/* Create PO Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <h2 className="text-xl font-bold mb-4">Create Purchase Order</h2>
              <form onSubmit={handleCreatePO} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Vendor
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
                        {vendor.name} ({vendor.currency})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Amount
                  </label>
                  <input
                    name="amount"
                    type="number"
                    value={formData.amount}
                    onChange={handleFormChange}
                    min={0}
                    step="0.01"
                    required
                    className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Budget Line (Optional)
                  </label>
                  <select
                    name="budgetLineId"
                    value={formData.budgetLineId}
                    onChange={handleFormChange}
                    className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm"
                  >
                    <option value="">-- Select Budget Line --</option>
                    {budgetLines.map((line) => (
                      <option key={line.id} value={line.id}>
                        {line.phase} - {line.department || 'General'} -{' '}
                        {line.name} (Remaining:{' '}
                        {line.remaining.toLocaleString()})
                      </option>
                    ))}
                  </select>
                  {budgetLines.length === 0 && (
                    <p className="text-xs text-slate-400 mt-1">
                      No budget lines available for this project.
                    </p>
                  )}
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
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 h-9 rounded-lg border border-slate-300 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 h-9 rounded-lg bg-blue-600 text-white text-sm font-semibold"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Purchase Orders Table */}
        {selectedProjectId && (
          <div className="mt-4">
            {loading ? (
              <p className="text-center text-slate-600 mt-6">Loading...</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left">PO Number</th>
                      <th className="px-4 py-2 text-left">Vendor</th>
                      <th className="px-4 py-2 text-right">Amount</th>
                      <th className="px-4 py-2 text-left">Budget Line</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Created</th>
                      <th className="px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseOrders.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-8 text-center text-slate-600"
                        >
                          No purchase orders found.
                        </td>
                      </tr>
                    ) : (
                      purchaseOrders.map((po) => (
                        <tr
                          key={po.id}
                          className="border-t hover:bg-slate-50"
                        >
                          <td className="px-4 py-2 font-semibold">
                            {po.poNo}
                          </td>
                          <td className="px-4 py-2">
                            {po.vendor?.name || 'N/A'}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {po.vendor?.currency} {po.amount.toLocaleString()}
                          </td>
                          <td className="px-4 py-2">
                            {po.budgetLine ? (
                              <span>
                                {po.budgetLine.phase} - {po.budgetLine.name}
                              </span>
                            ) : (
                              <span className="text-slate-400">Not linked</span>
                            )}
                          </td>
                          <td className="px-4 py-2">{po.status}</td>
                          <td className="px-4 py-2">
                            {new Date(po.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2">
                            {po.status === 'Pending' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateStatus(po.id, 'Approved')
                                  }
                                  className="mr-2 px-3 h-8 rounded-md border border-emerald-300 text-xs text-emerald-700 hover:bg-emerald-50"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateStatus(po.id, 'Rejected')
                                  }
                                  className="mr-2 px-3 h-8 rounded-md border border-amber-300 text-xs text-amber-700 hover:bg-amber-50"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDelete(po.id)}
                              className="px-3 h-8 rounded-md border border-red-300 text-xs text-red-600 hover:bg-red-50"
                            >
                              Delete
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
      </div>
    </div>
  );
}
