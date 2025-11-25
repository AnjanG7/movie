'use client';

import { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:4000/api';

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

interface PurchaseOrder {
    id: string;
    poNo: string;
    amount: number;
}

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [formData, setFormData] = useState({
        vendorId: '',
        poId: '',
        date: new Date().toISOString().split('T')[0],
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
                setInvoices(result.data.invoices);
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

    const handleCreateInvoice = async (e: React.FormEvent) => {
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
                    date: new Date().toISOString().split('T')[0],
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
        if (!confirm(`Are you sure you want to mark this invoice as ${status}?`))
            return;

        try {
            const response = await fetch(`${API_BASE_URL}/invoices/${invoiceId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status }),
            });

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
            const response = await fetch(`${API_BASE_URL}/invoices/${invoiceId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

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

    return (
        <div style={{ padding: '20px' }}>
            <h1>Invoices</h1>

            <div style={{ marginBottom: '20px' }}>
                <button
                    onClick={() => setShowCreateModal(true)}
                    style={{ padding: '8px 15px' }}
                >
                    Create New Invoice
                </button>
            </div>

            {/* Create Invoice Modal */}
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
                    <div style={{ backgroundColor: 'white', padding: '30px', width: '500px' }}>
                        <h2>Create Invoice</h2>
                        <form onSubmit={handleCreateInvoice}>
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
                                                {vendor.name}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label>
                                    Purchase Order (Optional):
                                    <input
                                        type="text"
                                        value={formData.poId}
                                        onChange={(e) =>
                                            setFormData({ ...formData, poId: e.target.value })
                                        }
                                        placeholder="PO ID"
                                        style={{ display: 'block', width: '100%', padding: '5px' }}
                                    />
                                </label>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label>
                                    Invoice Date:
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) =>
                                            setFormData({ ...formData, date: e.target.value })
                                        }
                                        required
                                        style={{ display: 'block', width: '100%', padding: '5px' }}
                                    />
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

            {/* Invoices Table */}
            {loading ? (
                <p>Loading...</p>
            ) : (
                <table border={1} cellPadding={10} style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th>Invoice Number</th>
                            <th>Vendor</th>
                            <th>PO Number</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center' }}>
                                    No invoices found
                                </td>
                            </tr>
                        ) : (
                            invoices.map((invoice) => (
                                <tr key={invoice.id}>
                                    <td>{invoice.docNo}</td>
                                    <td>{invoice.vendor?.name || 'N/A'}</td>
                                    <td>{invoice.po?.poNo || 'N/A'}</td>
                                    <td>{new Date(invoice.date).toLocaleDateString()}</td>
                                    <td>{invoice.amount.toLocaleString()}</td>
                                    <td>{invoice.status}</td>
                                    <td>
                                        {invoice.status === 'Pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleUpdateStatus(invoice.id, 'Approved')}
                                                    style={{ marginRight: '5px', padding: '5px 10px' }}
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(invoice.id, 'Rejected')}
                                                    style={{ marginRight: '5px', padding: '5px 10px' }}
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => handleDelete(invoice.id)}
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
    );
}
