'use client';

import React, {
  useState,
  useEffect,
  FormEvent,
  ChangeEvent,
} from 'react';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paidOn?: string;
  method?: string;
  status: string;
  createdAt: string;
  invoice?: {
    docNo: string;
    vendor?: {
      name: string;
    };
  };
}

interface Invoice {
  id: string;
  docNo: string;
  amount: number;
  status: string;
  vendor?: {
    name: string;
  };
}

interface Project {
  id: string;
  title: string;
}

interface PaymentFormData {
  invoiceId: string;
  amount: number;
  paidOn: string;
  method: string;
}

export default function PaymentsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [formData, setFormData] = useState<PaymentFormData>({
    invoiceId: '',
    amount: 0,
    paidOn: new Date().toISOString().split('T')[0]!,
    method: 'Bank Transfer',
  });

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch invoices and payments when project changes
  useEffect(() => {
    if (selectedProjectId) {
      fetchInvoices(selectedProjectId);
      fetchPayments(selectedProjectId);
    } else {
      setInvoices([]);
      setPayments([]);
    }
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects?limit=99999`, {
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

  const fetchInvoices = async (projectId: string) => {
    if (!projectId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/invoices/project/${projectId}?status=Approved`,
        {
          credentials: 'include',
        }
      );
      const result = await response.json();
      if (result.success) {
        setInvoices(result.data.invoices || []);
      } else {
        console.error('Error:', result.message);
        setInvoices([]);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async (projectId: string) => {
    if (!projectId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/payments/project/${projectId}`,
        {
          credentials: 'include',
        }
      );
      const result = await response.json();
      if (result.success) {
        setPayments(result.data.payments || []);
      } else {
        console.error('Error:', result.message);
        setPayments([]);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayment = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedProjectId) {
      alert('Please select a project first');
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/payments/project/${selectedProjectId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();
      if (result.success) {
        alert('Payment recorded successfully');
        setShowCreateModal(false);
        setFormData({
          invoiceId: '',
          amount: 0,
          paidOn: new Date().toISOString().split('T')[0]!,
          method: 'Bank Transfer',
        });
        fetchPayments(selectedProjectId);
        fetchInvoices(selectedProjectId);
      } else {
        alert(result.message || 'Failed to record payment');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Failed to record payment');
    }
  };

  const handleFormChange = (
    e: ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'amount') {
      setFormData((prev) => ({ ...prev, [name]: Number(value) }));
    } else if (name === 'invoiceId') {
      const selectedInvoice = invoices.find((inv) => inv.id === value);
      setFormData((prev) => ({
        ...prev,
        invoiceId: value,
        amount: selectedInvoice?.amount || 0,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const paidToday = payments.filter((p) => {
    if (!p.paidOn) return false;
    const d = new Date(p.paidOn).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    return d === today;
  }).reduce((sum, p) => sum + p.amount, 0);

  const distinctVendors = Array.from(
    new Set(payments.map((p) => p.invoice?.vendor?.name).filter(Boolean))
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-emerald-50 p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
          <div>
            <p className="text-xs font-semibold tracking-widest text-sky-600 uppercase mb-1">
              Cash Outflows
            </p>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              Payments Ledger
            </h1>
            <p className="text-slate-600 mt-2 text-sm lg:text-base">
              Monitor vendor settlements, payment methods, and timing at a glance.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Project:</span>
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
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="px-5 h-11 rounded-xl bg-gradient-to-r from-sky-600 to-emerald-500 text-white text-sm font-semibold shadow-lg hover:from-sky-700 hover:to-emerald-600"
              >
                Record New Payment
              </button>
            )}
          </div>
        </div>

        {!selectedProjectId ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No Project Selected
            </h3>
            <p className="text-slate-600">
              Please select a project from the dropdown above to view and manage payments.
            </p>
          </div>
        ) : (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="rounded-2xl border border-sky-100 bg-white shadow-sm p-4">
                <div className="text-xs font-semibold text-slate-500 uppercase mb-1">
                  Total Paid
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  ${totalPaid.toLocaleString()}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Across all recorded payments
                </div>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-white shadow-sm p-4">
                <div className="text-xs font-semibold text-slate-500 uppercase mb-1">
                  Paid Today
                </div>
                <div className="text-2xl font-bold text-emerald-600">
                  ${paidToday.toLocaleString()}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Payments with today&apos;s date
                </div>
              </div>
              <div className="rounded-2xl border border-indigo-100 bg-white shadow-sm p-4">
                <div className="text-xs font-semibold text-slate-500 uppercase mb-1">
                  Vendors Paid
                </div>
                <div className="text-2xl font-bold text-indigo-600">
                  {distinctVendors}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Unique vendors with at least one payment
                </div>
              </div>
            </div>

            {/* Create Payment Modal */}
            {showCreateModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                  <h2 className="text-xl font-bold mb-4">Record Payment</h2>
                  <form
                    onSubmit={handleCreatePayment}
                    className="space-y-4 text-sm"
                  >
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Invoice *
                      </label>
                      <select
                        name="invoiceId"
                        value={formData.invoiceId}
                        onChange={handleFormChange}
                        required
                        className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm"
                      >
                        <option value="">-- Select Invoice --</option>
                        {invoices.map((invoice) => (
                          <option key={invoice.id} value={invoice.id}>
                            {invoice.docNo} - {invoice.vendor?.name} ($
                            {invoice.amount.toLocaleString()})
                          </option>
                        ))}
                      </select>
                    </div>

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
                        step="0.01"
                        required
                        className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Defaults to the full invoice amount, but can be adjusted for partial payments.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Payment Date *
                        </label>
                        <input
                          name="paidOn"
                          type="date"
                          value={formData.paidOn}
                          onChange={handleFormChange}
                          required
                          className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Method
                        </label>
                        <select
                          name="method"
                          value={formData.method}
                          onChange={handleFormChange}
                          className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm"
                        >
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Check">Check</option>
                          <option value="Cash">Cash</option>
                          <option value="Wire">Wire</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateModal(false);
                          setFormData({
                            invoiceId: '',
                            amount: 0,
                            paidOn: new Date().toISOString().split('T')[0]!,
                            method: 'Bank Transfer',
                          });
                        }}
                        className="px-4 h-9 rounded-lg border border-slate-300 text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 h-9 rounded-lg bg-emerald-600 text-white text-sm font-semibold"
                      >
                        Record Payment
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Payments Table */}
            <div className="mt-6">
              {loading ? (
                <p className="text-center text-slate-600 mt-6">Loading...</p>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-slate-700">
                          Invoice Number
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-slate-700">
                          Vendor
                        </th>
                        <th className="px-4 py-2 text-right font-semibold text-slate-700">
                          Amount
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-slate-700">
                          Payment Date
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-slate-700">
                          Method
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-slate-700">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-8 text-center text-slate-600"
                          >
                            No payments found. Record your first vendor payment to
                            start tracking cash outflows.
                          </td>
                        </tr>
                      ) : (
                        payments.map((payment) => (
                          <tr
                            key={payment.id}
                            className="border-t hover:bg-slate-50"
                          >
                            <td className="px-4 py-2 font-semibold">
                              {payment.invoice?.docNo || 'N/A'}
                            </td>
                            <td className="px-4 py-2">
                              {payment.invoice?.vendor?.name || 'N/A'}
                            </td>
                            <td className="px-4 py-2 text-right font-semibold">
                              ${payment.amount.toLocaleString()}
                            </td>
                            <td className="px-4 py-2">
                              {payment.paidOn && !isNaN(new Date(payment.paidOn).getTime())
                                ? new Date(payment.paidOn).toLocaleDateString()
                                : 'N/A'}
                            </td>
                            <td className="px-4 py-2">
                              {payment.method || 'N/A'}
                            </td>
                            <td className="px-4 py-2">
                              {payment.status === 'Paid' && (
                                <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                                  Paid
                                </span>
                              )}
                              {payment.status !== 'Paid' && (
                                <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                                  {payment.status}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
