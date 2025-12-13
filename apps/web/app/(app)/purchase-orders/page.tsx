'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, FileText, X, Save, Check, XCircle } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface Project {
  id: string;
  title: string;
  baseCurrency: string;
  status: string;
}

interface Vendor {
  id: string;
  name: string;
  currency: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
}

interface PurchaseOrder {
  id: string;
  docNo: string;
  vendorId: string;
  vendor: Vendor;
  projectId: string;
  project: {
    id: string;
    title: string;
  };
  amount: number;
  status: string;
  description?: string;
  paymentTerms?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface PurchaseOrderFormData {
  vendorId: string;
  amount: string;
  description: string;
  paymentTerms: string;
}

export default function PurchaseOrdersPage() {
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [formData, setFormData] = useState<PurchaseOrderFormData>({
    vendorId: '',
    amount: '',
    description: '',
    paymentTerms: 'Net 30 days',
  });

  // Fetch all projects
  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects?fetchAll=true`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const result = await response.json();
      const projectsList = result.data.projects || [];
      setProjects(projectsList);

      // Auto-select first project if available
      if (projectsList.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projectsList[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Fetch vendors for selected project
  const fetchVendors = async (projectId: string) => {
    if (!projectId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/vendors/project/${projectId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch vendors');
      }

      const result = await response.json();
      setVendors(result.data.vendors || []);
    } catch (err: any) {
      console.error('Error fetching vendors:', err.message);
      setVendors([]);
    }
  };

  // Fetch purchase orders for selected project
  const fetchPurchaseOrders = async (projectId: string) => {
    if (!projectId) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/purchase-orders`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch purchase orders');
      }

      const result = await response.json();
      setPurchaseOrders(result.data.purchaseOrders || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchVendors(selectedProjectId);
      fetchPurchaseOrders(selectedProjectId);
    }
  }, [selectedProjectId]);

  // Handle project selection
  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProjectId(e.target.value);
    setPurchaseOrders([]);
    setVendors([]);
  };

  // Create purchase order
  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setError('Please select a project first');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/projects/${selectedProjectId}/purchase-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create purchase order');
      }

      await fetchPurchaseOrders(selectedProjectId);
      handleCloseModal();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update purchase order
  const handleUpdatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPO || !selectedProjectId) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/purchase-orders/${editingPO.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            ...formData,
            amount: parseFloat(formData.amount),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update purchase order');
      }

      await fetchPurchaseOrders(selectedProjectId);
      handleCloseModal();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Approve purchase order
  const handleApprovePO = async (poId: string) => {
    if (!selectedProjectId) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/purchase-orders/${poId}/approve`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to approve purchase order');
      }

      await fetchPurchaseOrders(selectedProjectId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Reject purchase order
  const handleRejectPO = async (poId: string) => {
    if (!selectedProjectId) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/purchase-orders/${poId}/reject`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reject purchase order');
      }

      await fetchPurchaseOrders(selectedProjectId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete purchase order
  const handleDeletePO = async (poId: string) => {
    if (!confirm('Are you sure you want to delete this purchase order?')) return;
    if (!selectedProjectId) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/purchase-orders/${poId}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete purchase order');
      }

      await fetchPurchaseOrders(selectedProjectId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Open modal for creating
  const handleOpenCreateModal = () => {
    if (!selectedProjectId) {
      setError('Please select a project first');
      return;
    }

    if (vendors.length === 0) {
      setError('Please create at least one vendor for this project first');
      return;
    }

    setEditingPO(null);
    setFormData({
      vendorId: '',
      amount: '',
      description: '',
      paymentTerms: 'Net 30 days',
    });
    setShowModal(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (po: PurchaseOrder) => {
    setEditingPO(po);
    setFormData({
      vendorId: po.vendorId,
      amount: po.amount.toString(),
      description: po.description || '',
      paymentTerms: po.paymentTerms || 'Net 30 days',
    });
    setShowModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPO(null);
    setError('');
  };

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      case 'Completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header with Project Selector */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
            <p className="text-gray-600 mt-1">Manage purchase orders for your projects</p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            disabled={!selectedProjectId || vendors.length === 0}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={20} />
            Create PO
          </button>
        </div>

        {/* Project Selector */}
        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Project *
          </label>
          <select
            value={selectedProjectId}
            onChange={handleProjectChange}
            className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Select a Project --</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title} ({project.baseCurrency})
              </option>
            ))}
          </select>
          {selectedProject && (
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
              <span>
                <strong>Status:</strong> {selectedProject.status}
              </span>
              <span>
                <strong>Currency:</strong> {selectedProject.baseCurrency}
              </span>
              <span>
                <strong>Vendors:</strong> {vendors.length}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-800 hover:text-red-900">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && purchaseOrders.length === 0 && selectedProjectId && (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading purchase orders...</div>
        </div>
      )}

      {/* No Project Selected */}
      {!selectedProjectId && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Project Selected</h3>
          <p className="text-gray-600">Please select a project to view and manage purchase orders</p>
        </div>
      )}

      {/* Purchase Orders Table */}
      {selectedProjectId && !loading && purchaseOrders.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No purchase orders yet</h3>
          <p className="text-gray-600 mb-4">Create your first purchase order</p>
          {vendors.length === 0 ? (
            <p className="text-sm text-red-600">Please create a vendor first</p>
          ) : (
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              Create PO
            </button>
          )}
        </div>
      )}

      {selectedProjectId && purchaseOrders.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PO Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText size={16} className="text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{po.docNo}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{po.vendor.name}</div>
                      <div className="text-xs text-gray-500">{po.vendor.currency}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {po.vendor.currency} {po.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          po.status
                        )}`}
                      >
                        {po.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {po.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(po.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {po.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleApprovePO(po.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Approve"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={() => handleRejectPO(po.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Reject"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleOpenEditModal(po)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDeletePO(po.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingPO ? 'Edit Purchase Order' : 'Create Purchase Order'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={editingPO ? handleUpdatePO : handleCreatePO}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vendor *
                  </label>
                  <select
                    name="vendorId"
                    value={formData.vendorId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter amount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Terms
                  </label>
                  <input
                    type="text"
                    name="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Net 30 days"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={20} />
                  {loading ? 'Saving...' : editingPO ? 'Update PO' : 'Create PO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}