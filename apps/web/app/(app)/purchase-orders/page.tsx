'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

const API_BASE_URL = 'http://localhost:4000/api';

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

export default function PurchaseOrdersPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');
  const [formData, setFormData] = useState({
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
        {
          credentials: 'include',
        }
      );
      const result = await response.json();
      if (result.success) {
        setPurchaseOrders(result.data.purchaseOrders);
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePO = async (e: React.FormEvent) => {
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

  return (
    <div style={{ padding: '20px' }}>
      <h1>Purchase Orders</h1>

      {/* Project Selector */}
      <div style={{ marginBottom: '20px' }}>
        <label>
          Select Project:
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px' }}
          >
            <option value="">-- Select Project --</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={!selectedProjectId}
          style={{ marginLeft: '20px', padding: '8px 15px' }}
        >
          Create New PO
        </button>
      </div>

      {/* Create PO Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ backgroundColor: 'white', padding: '30px', width: '500px', borderRadius: '8px' }}>
            <h2>Create Purchase Order</h2>
            <form onSubmit={handleCreatePO}>
              <div style={{ marginBottom: '15px' }}>
                <label>
                  Vendor:
                  <select
                    value={formData.vendorId}
                    onChange={(e) =>
                      setFormData({ ...formData, vendorId: e.target.value })
                    }
                    required
                    style={{ display: 'block', width: '100%', padding: '5px' }}
                  >
                    <option value="">-- Select Vendor --</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name} ({vendor.currency})
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label>
                  Amount:
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: Number(e.target.value) })
                    }
                    required
                    style={{ display: 'block', width: '100%', padding: '5px' }}
                  />
                </label>
              </div>

              {/* Budget Line Selection */}
              <div style={{ marginBottom: '15px' }}>
                <label>
                  Budget Line (Optional):
                  <select
                    value={formData.budgetLineId}
                    onChange={(e) =>
                      setFormData({ ...formData, budgetLineId: e.target.value })
                    }
                    style={{ display: 'block', width: '100%', padding: '5px' }}
                  >
                    <option value="">-- Select Budget Line --</option>
                    {budgetLines.map((line) => (
                      <option key={line.id} value={line.id}>
                        {line.phase} - {line.department || 'General'} - {line.name} 
                        (Remaining: {line.remaining.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </label>
                {budgetLines.length === 0 && (
                  <p style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                    No budget lines available for this project
                  </p>
                )}
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label>
                  Notes:
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    style={{ display: 'block', width: '100%', padding: '5px' }}
                    rows={3}
                  />
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ padding: '8px 15px' }}>
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: '8px 15px' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchase Orders Table */}
      {selectedProjectId && (
        <div>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <table border={1} cellPadding={10} style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Vendor</th>
                  <th>Amount</th>
                  <th>Budget Line</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center' }}>
                      No purchase orders found
                    </td>
                  </tr>
                ) : (
                  purchaseOrders.map((po) => (
                    <tr key={po.id}>
                      <td>{po.poNo}</td>
                      <td>{po.vendor?.name || 'N/A'}</td>
                      <td>
                        {po.vendor?.currency} {po.amount.toLocaleString()}
                      </td>
                      <td>
                        {po.budgetLine ? (
                          <span>
                            {po.budgetLine.phase} - {po.budgetLine.name}
                          </span>
                        ) : (
                          <span style={{ color: '#999' }}>Not linked</span>
                        )}
                      </td>
                      <td>{po.status}</td>
                      <td>{new Date(po.createdAt).toLocaleDateString()}</td>
                      <td>
                        {po.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(po.id, 'Approved')}
                              style={{ marginRight: '5px', padding: '5px 10px' }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(po.id, 'Rejected')}
                              style={{ marginRight: '5px', padding: '5px 10px' }}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(po.id)}
                          style={{ padding: '5px 10px' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
