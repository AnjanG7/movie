'use client';

import { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:4000/api';

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
    vendor?: {
        name: string;
    };
}

export default function PaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [formData, setFormData] = useState({
        invoiceId: '',
        amount: 0,
        paidOn: new Date().toISOString().split('T')[0],
        method: 'Bank Transfer',
    });

    useEffect(() => {
        fetchPayments();
        fetchInvoices();
    }, []);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/payments`, {
                credentials: 'include',
            });
            const result = await response.json();
            if (result.success) {
                setPayments(result.data.payments);
            }
        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchInvoices = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/invoices?status=Approved`, {
                credentials: 'include',
            });
            const result = await response.json();
            if (result.success) {
                setInvoices(result.data.invoices);
            }
        } catch (error) {
            console.error('Error fetching invoices:', error);
        }
    };

    const handleCreatePayment = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch(`${API_BASE_URL}/payments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData),
            });

            const result = await response.json();
            if (result.success) {
                alert('Payment recorded successfully');
                setShowCreateModal(false);
                setFormData({
                    invoiceId: '',
                    amount: 0,
                    paidOn: new Date().toISOString().split('T')[0],
                    method: 'Bank Transfer',
                });
                fetchPayments();
                fetchInvoices();
            } else {
                alert(result.message || 'Failed to record payment');
            }
        } catch (error) {
            console.error('Error creating payment:', error);
            alert('Failed to record payment');
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>Payments</h1>

            <div style={{ marginBottom: '20px' }}>
                <button
                    onClick={() => setShowCreateModal(true)}
                    style={{ padding: '8px 15px' }}
                >
                    Record New Payment
                </button>
            </div>

            {/* Create Payment Modal */}
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
                        <h2>Record Payment</h2>
                        <form onSubmit={handleCreatePayment}>
                            <div style={{ marginBottom: '15px' }}>
                                <label>
                                    Invoice:
                                    <select
                                        value={formData.invoiceId}
                                        onChange={(e) => {
                                            const selectedInvoice = invoices.find(
                                                (inv) => inv.id === e.target.value
                                            );
                                            setFormData({
                                                ...formData,
                                                invoiceId: e.target.value,
                                                amount: selectedInvoice?.amount || 0,
                                            });
                                        }}
                                        required
                                        style={{ display: 'block', width: '100%', padding: '5px' }}
                                    >
                                        <option value="">-- Select Invoice --</option>
                                        {invoices.map((invoice) => (
                                            <option key={invoice.id} value={invoice.id}>
                                                {invoice.docNo} - {invoice.vendor?.name} (
                                                {invoice.amount.toLocaleString()})
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

                            <div style={{ marginBottom: '15px' }}>
                                <label>
                                    Payment Date:
                                    <input
                                        type="date"
                                        value={formData.paidOn}
                                        onChange={(e) =>
                                            setFormData({ ...formData, paidOn: e.target.value })
                                        }
                                        required
                                        style={{ display: 'block', width: '100%', padding: '5px' }}
                                    />
                                </label>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label>
                                    Payment Method:
                                    <select
                                        value={formData.method}
                                        onChange={(e) =>
                                            setFormData({ ...formData, method: e.target.value })
                                        }
                                        style={{ display: 'block', width: '100%', padding: '5px' }}
                                    >
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="Check">Check</option>
                                        <option value="Cash">Cash</option>
                                        <option value="Wire">Wire</option>
                                    </select>
                                </label>
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="submit" style={{ padding: '8px 15px' }}>
                                    Record Payment
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

            {/* Payments Table */}
            {loading ? (
                <p>Loading...</p>
            ) : (
                <table border={1} cellPadding={10} style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th>Invoice Number</th>
                            <th>Vendor</th>
                            <th>Amount</th>
                            <th>Payment Date</th>
                            <th>Method</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center' }}>
                                    No payments found
                                </td>
                            </tr>
                        ) : (
                            payments.map((payment) => (
                                <tr key={payment.id}>
                                    <td>{payment.invoice?.docNo || 'N/A'}</td>
                                    <td>{payment.invoice?.vendor?.name || 'N/A'}</td>
                                    <td>{payment.amount.toLocaleString()}</td>
                                    <td>
                                        {payment.paidOn
                                            ? new Date(payment.paidOn).toLocaleDateString()
                                            : 'N/A'}
                                    </td>
                                    <td>{payment.method || 'N/A'}</td>
                                    <td>{payment.status}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
}
