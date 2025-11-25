'use client';

import { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:4000/api';

interface ScheduledPayment {
  id: string;
  payeeId: string;
  total: number;
  paidAmount?: number;
  remainingAmount?: number;
  status: string;
  createdAt: string;
  payee?: {
    name: string;
    currency: string;
  };
  installments: Installment[];
  allocations: Allocation[];
}

interface Installment {
  id: string;
  scheduledPaymentId: string;
  dueDate: string;
  amount: number;
  status: string;
}

interface Allocation {
  id: string;
  phase: string;
  lineRefId?: string;
  amount: number;
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

interface InstallmentForm {
  dueDate: string;
  amount: number;
}

interface AllocationForm {
  phase: string;
  amount: number;
}

interface FormData {
  payeeId: string;
  total: number;
  installments: InstallmentForm[];
  allocations: AllocationForm[];
}

export default function ScheduledPaymentsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [scheduledPayments, setScheduledPayments] = useState<ScheduledPayment[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedPayment, setExpandedPayment] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    payeeId: '',
    total: 0,
    installments: [
      { dueDate: '', amount: 0 },
      { dueDate: '', amount: 0 },
    ],
    allocations: [{ phase: 'PRODUCTION', amount: 0 }],
  });

  useEffect(() => {
    fetchProjects();
    fetchVendors();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchScheduledPayments();
    }
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects?limit=-1`, {
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

  const fetchScheduledPayments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/payments/scheduled`, {
        credentials: 'include',
      });
      const result = await response.json();
      if (result.success) {
        setScheduledPayments(result.data.scheduledPayments || []);
      }
    } catch (error) {
      console.error('Error fetching scheduled payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateScheduledPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate total matches sum of installments
    const installmentTotal = formData.installments.reduce(
      (sum, inst) => sum + Number(inst.amount),
      0
    );
    if (Math.abs(installmentTotal - formData.total) > 0.01) {
      alert(`Installments (${installmentTotal}) must equal total (${formData.total})`);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/payments/scheduled`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (result.success) {
        alert('Scheduled payment created successfully');
        setShowCreateModal(false);
        resetForm();
        fetchScheduledPayments();
      } else {
        alert(result.message || 'Failed to create scheduled payment');
      }
    } catch (error) {
      console.error('Error creating scheduled payment:', error);
      alert('Failed to create scheduled payment');
    }
  };

  const handleMarkInstallmentPaid = async (
    scheduledPaymentId: string,
    installmentId: string,
    amount: number
  ) => {
    if (!confirm('Mark this installment as paid?')) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/payments/scheduled/${scheduledPaymentId}/installments/${installmentId}/pay`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            paidAmount: amount,
            paymentMethod: 'Bank Transfer',
            paidDate: new Date().toISOString(),
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        alert('Installment marked as paid');
        fetchScheduledPayments();
      } else {
        alert(result.message || 'Failed to update installment');
      }
    } catch (error) {
      console.error('Error updating installment:', error);
      alert('Failed to update installment');
    }
  };

 const addInstallment = () => {
  const newInstallment: InstallmentForm = { dueDate: '', amount: 0 };
  setFormData({
    ...formData,
    installments: [...formData.installments, newInstallment],
  });
};


  const removeInstallment = (index: number) => {
    const newInstallments = formData.installments.filter((_, i) => i !== index);
    setFormData({ ...formData, installments: newInstallments });
  };

const updateInstallment = (index: number, field: keyof InstallmentForm, value: string | number) => {
  const newInstallments: InstallmentForm[] = formData.installments.map((inst, i) => {
    if (i !== index) return inst;
    
    const updated: InstallmentForm = { ...inst };
    if (field === 'dueDate') {
      updated.dueDate = value as string;
    } else if (field === 'amount') {
      updated.amount = value as number;
    }
    return updated;
  });
  setFormData({ ...formData, installments: newInstallments });
};


const addAllocation = () => {
  const newAllocation: AllocationForm = { phase: 'PRODUCTION', amount: 0 };
  setFormData({
    ...formData,
    allocations: [...formData.allocations, newAllocation],
  });
};


  const removeAllocation = (index: number) => {
    const newAllocations = formData.allocations.filter((_, i) => i !== index);
    setFormData({ ...formData, allocations: newAllocations });
  };

const updateAllocation = (index: number, field: keyof AllocationForm, value: string | number) => {
  const newAllocations: AllocationForm[] = formData.allocations.map((alloc, i) => {
    if (i !== index) return alloc;
    
    const updated: AllocationForm = { ...alloc };
    if (field === 'phase') {
      updated.phase = value as string;
    } else if (field === 'amount') {
      updated.amount = value as number;
    }
    return updated;
  });
  setFormData({ ...formData, allocations: newAllocations });
};



  const resetForm = () => {
    setFormData({
      payeeId: '',
      total: 0,
      installments: [
        { dueDate: '', amount: 0 },
        { dueDate: '', amount: 0 },
      ],
      allocations: [{ phase: 'PRODUCTION', amount: 0 }],
    });
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getUpcomingInstallments = () => {
    const upcoming: Array<Installment & { paymentId: string; vendor?: string }> = [];
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    scheduledPayments.forEach((payment) => {
      payment.installments.forEach((installment) => {
        if (
          installment.status === 'Pending' &&
          new Date(installment.dueDate) <= thirtyDaysFromNow
        ) {
          upcoming.push({
            ...installment,
            paymentId: payment.id,
            vendor: payment.payee?.name,
          });
        }
      });
    });

    return upcoming.sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Scheduled Payments & Installments</h1>

      {/* Action Buttons */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={() => setShowCreateModal(true)} style={{ padding: '8px 15px' }}>
          Create Scheduled Payment
        </button>
      </div>

      {/* Create Modal */}
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
            zIndex: 1000,
            overflow: 'auto',
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '30px',
              width: '700px',
              maxHeight: '90vh',
              overflow: 'auto',
              borderRadius: '8px',
            }}
          >
            <h2>Create Scheduled Payment</h2>
            <form onSubmit={handleCreateScheduledPayment}>
              {/* Vendor Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label>
                  <strong>Vendor (Payee):</strong>
                  <select
                    value={formData.payeeId}
                    onChange={(e) =>
                      setFormData({ ...formData, payeeId: e.target.value })
                    }
                    required
                    style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px' }}
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

              {/* Total Amount */}
              <div style={{ marginBottom: '20px' }}>
                <label>
                  <strong>Total Amount:</strong>
                  <input
                    type="number"
                    value={formData.total}
                    onChange={(e) =>
                      setFormData({ ...formData, total: Number(e.target.value) })
                    }
                    required
                    min="0"
                    step="0.01"
                    style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px' }}
                  />
                </label>
              </div>

              {/* Installments */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <strong>Installments:</strong>
                  <button type="button" onClick={addInstallment} style={{ padding: '5px 10px' }}>
                    + Add Installment
                  </button>
                </div>

                {formData.installments.map((installment, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      gap: '10px',
                      marginBottom: '10px',
                      padding: '10px',
                      backgroundColor: '#f9f9f9',
                      borderRadius: '4px',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '12px' }}>Due Date:</label>
                      <input
                        type="date"
                        value={installment.dueDate}
                        onChange={(e) =>
                          updateInstallment(index, 'dueDate', e.target.value)
                        }
                        required
                        style={{ width: '100%', padding: '5px' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '12px' }}>Amount:</label>
                      <input
                        type="number"
                        value={installment.amount}
                        onChange={(e) =>
                          updateInstallment(index, 'amount', Number(e.target.value))
                        }
                        required
                        min="0"
                        step="0.01"
                        style={{ width: '100%', padding: '5px' }}
                      />
                    </div>
                    {formData.installments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeInstallment(index)}
                        style={{ padding: '5px 10px', alignSelf: 'end' }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}

                <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  Installments Total:{' '}
                  {formatCurrency(
                    formData.installments.reduce((sum, i) => sum + Number(i.amount), 0)
                  )}
                </p>
              </div>

              {/* Allocations */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <strong>Budget Allocations:</strong>
                  <button type="button" onClick={addAllocation} style={{ padding: '5px 10px' }}>
                    + Add Allocation
                  </button>
                </div>

                {formData.allocations.map((allocation, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      gap: '10px',
                      marginBottom: '10px',
                      padding: '10px',
                      backgroundColor: '#f9f9f9',
                      borderRadius: '4px',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '12px' }}>Phase:</label>
                      <select
                        value={allocation.phase}
                        onChange={(e) => updateAllocation(index, 'phase', e.target.value)}
                        required
                        style={{ width: '100%', padding: '5px' }}
                      >
                        <option value="DEVELOPMENT">Development</option>
                        <option value="PRODUCTION">Production</option>
                        <option value="POST">Post-Production</option>
                        <option value="PUBLICITY">Publicity</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '12px' }}>Amount:</label>
                      <input
                        type="number"
                        value={allocation.amount}
                        onChange={(e) =>
                          updateAllocation(index, 'amount', Number(e.target.value))
                        }
                        required
                        min="0"
                        step="0.01"
                        style={{ width: '100%', padding: '5px' }}
                      />
                    </div>
                    {formData.allocations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAllocation(index)}
                        style={{ padding: '5px 10px', alignSelf: 'end' }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Form Actions */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ padding: '10px 20px' }}>
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  style={{ padding: '10px 20px' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upcoming Payments Widget */}
      <div
        style={{
          marginBottom: '30px',
          padding: '20px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '8px',
        }}
      >
        <h3 style={{ margin: '0 0 15px 0' }}>⏰ Upcoming Payments (Next 30 Days)</h3>
        {getUpcomingInstallments().length === 0 ? (
          <p style={{ margin: 0 }}>No upcoming payments in the next 30 days.</p>
        ) : (
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Due Date</th>
                <th style={{ textAlign: 'left' }}>Vendor</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {getUpcomingInstallments().map((inst) => (
                <tr key={inst.id}>
                  <td>{new Date(inst.dueDate).toLocaleDateString()}</td>
                  <td>{inst.vendor}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(inst.amount)}</td>
                  <td>
                    <button
                      onClick={() =>
                        handleMarkInstallmentPaid(inst.paymentId, inst.id, inst.amount)
                      }
                      style={{ padding: '5px 10px', fontSize: '12px' }}
                    >
                      Mark Paid
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Scheduled Payments List */}
      <h2>All Scheduled Payments</h2>
      {loading ? (
        <p>Loading...</p>
      ) : scheduledPayments.length === 0 ? (
        <p>No scheduled payments yet. Create one to get started.</p>
      ) : (
        <div>
          {scheduledPayments.map((payment) => (
            <div
              key={payment.id}
              style={{
                marginBottom: '20px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              {/* Payment Header */}
              <div
                style={{
                  padding: '15px',
                  backgroundColor: '#f5f5f5',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                onClick={() =>
                  setExpandedPayment(
                    expandedPayment === payment.id ? null : payment.id
                  )
                }
              >
                <div>
                  <strong>{payment.payee?.name}</strong>
                  <span style={{ marginLeft: '20px', color: '#666' }}>
                    Total: {payment.payee?.currency} {formatCurrency(payment.total)}
                  </span>
                  <span
                    style={{
                      marginLeft: '20px',
                      padding: '4px 8px',
                      backgroundColor:
                        payment.status === 'Completed' ? '#d4edda' : '#fff3cd',
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}
                  >
                    {payment.status}
                  </span>
                </div>
                <span>{expandedPayment === payment.id ? '▼' : '▶'}</span>
              </div>

              {/* Payment Details */}
              {expandedPayment === payment.id && (
                <div style={{ padding: '15px' }}>
                  {/* Installments */}
                  <h4>Installments ({payment.installments.length})</h4>
                  <table
                    border={1}
                    cellPadding={8}
                    style={{ width: '100%', marginBottom: '20px' }}
                  >
                    <thead style={{ backgroundColor: '#f9f9f9' }}>
                      <tr>
                        <th>#</th>
                        <th>Due Date</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payment.installments.map((inst, index) => (
                        <tr key={inst.id}>
                          <td>{index + 1}</td>
                          <td>{new Date(inst.dueDate).toLocaleDateString()}</td>
                          <td style={{ textAlign: 'right' }}>
                            {formatCurrency(inst.amount)}
                          </td>
                          <td>
                            <span
                              style={{
                                padding: '4px 8px',
                                backgroundColor:
                                  inst.status === 'Paid' ? '#d4edda' : '#fff3cd',
                                borderRadius: '4px',
                                fontSize: '12px',
                              }}
                            >
                              {inst.status}
                            </span>
                          </td>
                          <td>
                            {inst.status === 'Pending' && (
                              <button
                                onClick={() =>
                                  handleMarkInstallmentPaid(
                                    payment.id,
                                    inst.id,
                                    inst.amount
                                  )
                                }
                                style={{ padding: '5px 10px' }}
                              >
                                Mark Paid
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Allocations */}
                  {payment.allocations && payment.allocations.length > 0 && (
                    <>
                      <h4>Budget Allocations</h4>
                      <table border={1} cellPadding={8} style={{ width: '100%' }}>
                        <thead style={{ backgroundColor: '#f9f9f9' }}>
                          <tr>
                            <th>Phase</th>
                            <th style={{ textAlign: 'right' }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payment.allocations.map((alloc) => (
                            <tr key={alloc.id}>
                              <td>{alloc.phase}</td>
                              <td style={{ textAlign: 'right' }}>
                                {formatCurrency(alloc.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
