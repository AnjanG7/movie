'use client';

import React, {
  useState,
  useEffect,
  FormEvent,
  ChangeEvent,
} from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download } from 'lucide-react';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface Invoice {
  id: string;
  docNo: string;
  vendorId: string;
  poId?: string;
  date: string;
  amount: number;
  status: string;
  createdAt: string;
  vendor?: {
    name: string;
    currency: string;
  };
  po?: {
    poNo: string;
  };
}

interface Vendor {
  id: string;
  name: string;
  currency: string;
}

interface InvoiceFormData {
  vendorId: string;
  poId: string;
  date: string;
  amount: number;
  notes: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [formData, setFormData] = useState<InvoiceFormData>({
    vendorId: '',
    poId: '',
    date: new Date().toISOString().split('T')[0] as string,
    amount: 0,
    notes: '',
  });

  useEffect(() => {
    fetchInvoices();
    fetchVendors();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/invoices`, {
        credentials: 'include',
      });
      const result = await response.json();
      if (result.success) {
        setInvoices(result.data.invoices || []);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
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

  const handleCreateInvoice = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          poId: formData.poId || undefined,
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert('Invoice created successfully');
        setShowCreateModal(false);
        setFormData({
          vendorId: '',
          poId: '',
          date: new Date().toISOString().split('T')[0] as string,
          amount: 0,
          notes: '',
        });
        fetchInvoices();
      } else {
        alert(result.message || 'Failed to create invoice');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Failed to create invoice');
    }
  };

  const handleUpdateStatus = async (invoiceId: string, status: string) => {
    if (
      !confirm(`Are you sure you want to mark this invoice as ${status}?`)
    )
      return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/invoices/${invoiceId}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status }),
        }
      );

      const result = await response.json();
      if (result.success) {
        alert(`Invoice ${status.toLowerCase()} successfully`);
        fetchInvoices();
      } else {
        alert(result.message || 'Failed to update invoice');
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      alert('Failed to update invoice');
    }
  };

  const handleDelete = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/invoices/${invoiceId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      const result = await response.json();
      if (result.success) {
        alert('Invoice deleted successfully');
        fetchInvoices();
      } else {
        alert(result.message || 'Failed to delete invoice');
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Failed to delete invoice');
    }
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

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const pendingCount = invoices.filter((i) => i.status === 'Pending').length;
  const approvedCount = invoices.filter((i) => i.status === 'Approved').length;
  const rejectedCount = invoices.filter((i) => i.status === 'Rejected').length;
 
  const exportInvoiceToPDF = (invoice: any) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text('INVOICE', 14, 20);
  
  doc.setFontSize(11);
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, 14, 35);
  doc.text(`Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`, 14, 41);
  doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 14, 47);
  doc.text(`Vendor: ${invoice.vendor?.name || 'N/A'}`, 14, 53);
  doc.text(`Status: ${invoice.status}`, 14, 59);

  // Amount
  doc.setFontSize(16);
  doc.setFont("Helvetica", 'bold');
  doc.text(`Amount: ${invoice.amount.toLocaleString()}`, 14, 75);

  // Description
  if (invoice.description) {
    doc.setFontSize(10);
    doc.setFont("Helvetica", 'normal');
    doc.text('Description:', 14, 90);
    doc.text(invoice.description, 14, 96, { maxWidth: 180 });
  }

  // Save
  const filename = `Invoice_${invoice.invoiceNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};

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
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 h-10 rounded-lg bg-indigo-600 text-white text-sm font-semibold shadow-sm hover:bg-indigo-700"
          >
            Create New Invoice
          </button>
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
                {totalAmount.toLocaleString()}
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
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <h2 className="text-xl font-bold mb-4">Create Invoice</h2>
              <form
                onSubmit={handleCreateInvoice}
                className="space-y-4 text-sm"
              >
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
                        {vendor.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Purchase Order (Optional)
                  </label>
                  <input
                    name="poId"
                    type="text"
                    value={formData.poId}
                    onChange={handleFormChange}
                    placeholder="PO ID"
                    className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Invoice Date
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
                    Notes (optional)
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
                    className="px-4 h-9 rounded-lg bg-indigo-600 text-white text-sm font-semibold"
                  >
                    Create
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
                        colSpan={7}
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
                          {invoice.vendor?.name || 'N/A'}
                        </td>
                        <td className="px-4 py-2">
                          {invoice.po?.poNo || 'N/A'}
                        </td>
                        <td className="px-4 py-2">
                          {new Date(invoice.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {invoice.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-2">
                          {invoice.status === 'Pending' && (
                            <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                              Pending
                            </span>
                          )}
                          {invoice.status === 'Approved' && (
                            <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                              Approved
                            </span>
                          )}
                          {invoice.status === 'Rejected' && (
                            <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                              Rejected
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {invoice.status === 'Pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateStatus(invoice.id, 'Approved')
                                }
                                className="mr-2 px-3 h-8 rounded-md border border-emerald-300 text-xs text-emerald-700 hover:bg-emerald-50"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateStatus(invoice.id, 'Rejected')
                                }
                                className="mr-2 px-3 h-8 rounded-md border border-amber-300 text-xs text-amber-700 hover:bg-amber-50"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(invoice.id)}
                            className="px-3 h-8 rounded-md border border-red-300 text-xs text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                                  <button
          onClick={() => exportInvoiceToPDF(invoice)}
          className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
          title="Download PDF"
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
      </div>
    </div>
  );
}
