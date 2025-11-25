'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

const API_BASE_URL = 'http://localhost:4000/api';

interface FinancingSource {
    id: string;
    projectId: string;
    type: string;
    amount: number;
    rate?: number;
    fees?: number;
    totalDrawn: number;
    remaining: number;
    createdAt: string;
}

interface Project {
    id: string;
    title: string;
    baseCurrency: string;
}

interface Drawdown {
    id: string;
    sourceId: string;
    date: string;
    amount: number;
    source?: {
        type: string;
    };
}

export default function FinancingSourcesPage() {
    const searchParams = useSearchParams();
    const projectIdParam = searchParams.get('projectId');

    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState(projectIdParam || '');
    const [sources, setSources] = useState<FinancingSource[]>([]);
    const [drawdowns, setDrawdowns] = useState<Drawdown[]>([]);
    const [loading, setLoading] = useState(false);
    const [showSourceModal, setShowSourceModal] = useState(false);
    const [showDrawdownModal, setShowDrawdownModal] = useState(false);
    const [selectedSource, setSelectedSource] = useState<FinancingSource | null>(null);

    const [sourceFormData, setSourceFormData] = useState({
        type: 'EQUITY',
        amount: 0,
        rate: 0,
        fees: 0,
    });

    const [drawdownFormData, setDrawdownFormData] = useState({
        sourceId: '',
        date: new Date().toISOString().split('T')[0],
        amount: 0,
    });

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        if (selectedProjectId) {
            fetchFinancingSources();
            fetchDrawdowns();
        }
    }, [selectedProjectId]);

    const fetchProjects = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/projects?limit=100`, {
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

    const fetchFinancingSources = async () => {
        if (!selectedProjectId) return;
        setLoading(true);
        try {
            const response = await fetch(
                `${API_BASE_URL}/projects/${selectedProjectId}/financing-sources`,
                { credentials: 'include' }
            );
            const result = await response.json();
            if (result.success) {
                setSources(result.data);
            }
        } catch (error) {
            console.error('Error fetching sources:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDrawdowns = async () => {
        if (!selectedProjectId) return;
        try {
            const response = await fetch(
                `${API_BASE_URL}/projects/${selectedProjectId}/drawdowns`,
                { credentials: 'include' }
            );
            const result = await response.json();
            if (result.success) {
                setDrawdowns(result.data);
            }
        } catch (error) {
            console.error('Error fetching drawdowns:', error);
        }
    };

    const handleCreateSource = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch(
                `${API_BASE_URL}/projects/${selectedProjectId}/financing-sources`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(sourceFormData),
                }
            );

            const result = await response.json();
            if (result.success) {
                alert('Financing source created');
                setShowSourceModal(false);
                setSourceFormData({ type: 'EQUITY', amount: 0, rate: 0, fees: 0 });
                fetchFinancingSources();
            } else {
                alert(result.message || 'Failed to create source');
            }
        } catch (error) {
            console.error('Error creating source:', error);
            alert('Failed to create source');
        }
    };

    const handleCreateDrawdown = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch(
                `${API_BASE_URL}/projects/${selectedProjectId}/drawdowns`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(drawdownFormData),
                }
            );

            const result = await response.json();
            if (result.success) {
                alert('Drawdown created');
                setShowDrawdownModal(false);
                setDrawdownFormData({
                    sourceId: '',
                    date: new Date().toISOString().split('T')[0],
                    amount: 0,
                });
                fetchFinancingSources();
                fetchDrawdowns();
            } else {
                alert(result.message || 'Failed to create drawdown');
            }
        } catch (error) {
            console.error('Error creating drawdown:', error);
            alert('Failed to create drawdown');
        }
    };

    const handleDeleteSource = async (id: string) => {
        if (!confirm('Delete this financing source?')) return;

        try {
            const response = await fetch(
                `${API_BASE_URL}/projects/${selectedProjectId}/financing-sources/${id}`,
                {
                    method: 'DELETE',
                    credentials: 'include',
                }
            );

            const result = await response.json();
            if (result.success) {
                alert('Source deleted');
                fetchFinancingSources();
            } else {
                alert(result.message || 'Failed to delete');
            }
        } catch (error) {
            console.error('Error deleting:', error);
            alert('Failed to delete');
        }
    };

    const handleDeleteDrawdown = async (id: string) => {
        if (!confirm('Delete this drawdown?')) return;

        try {
            const response = await fetch(
                `${API_BASE_URL}/projects/${selectedProjectId}/drawdowns/${id}`,
                {
                    method: 'DELETE',
                    credentials: 'include',
                }
            );

            const result = await response.json();
            if (result.success) {
                alert('Drawdown deleted');
                fetchFinancingSources();
                fetchDrawdowns();
            } else {
                alert(result.message || 'Failed to delete');
            }
        } catch (error) {
            console.error('Error deleting:', error);
            alert('Failed to delete');
        }
    };

    const formatCurrency = (amount: number) => {
        const project = projects.find((p) => p.id === selectedProjectId);
        const currency = project?.baseCurrency || 'USD';
        return `${currency} ${amount.toLocaleString()}`;
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>Financing Sources & Drawdowns</h1>

            {/* Project Selector */}
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
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

                {selectedProjectId && (
                    <>
                        <button onClick={() => setShowSourceModal(true)} style={{ padding: '8px 15px' }}>
                            Add Financing Source
                        </button>
                        <button onClick={() => setShowDrawdownModal(true)} style={{ padding: '8px 15px' }}>
                            Record Drawdown
                        </button>
                    </>
                )}
            </div>

            {/* Create Source Modal */}
            {showSourceModal && (
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
                        <h2>Add Financing Source</h2>
                        <form onSubmit={handleCreateSource}>
                            <div style={{ marginBottom: '15px' }}>
                                <label>
                                    Type:
                                    <select
                                        value={sourceFormData.type}
                                        onChange={(e) =>
                                            setSourceFormData({ ...sourceFormData, type: e.target.value })
                                        }
                                        required
                                        style={{ display: 'block', width: '100%', padding: '5px' }}
                                    >
                                        <option value="EQUITY">Equity Investment</option>
                                        <option value="LOAN">Loan</option>
                                        <option value="GRANT">Grant</option>
                                        <option value="INCENTIVE">Tax Incentive</option>
                                        <option value="MG">Minimum Guarantee</option>
                                    </select>
                                </label>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label>
                                    Total Amount:
                                    <input
                                        type="number"
                                        value={sourceFormData.amount}
                                        onChange={(e) =>
                                            setSourceFormData({
                                                ...sourceFormData,
                                                amount: Number(e.target.value),
                                            })
                                        }
                                        required
                                        min="0"
                                        step="0.01"
                                        style={{ display: 'block', width: '100%', padding: '5px' }}
                                    />
                                </label>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label>
                                    Interest Rate (%) - Optional:
                                    <input
                                        type="number"
                                        value={sourceFormData.rate}
                                        onChange={(e) =>
                                            setSourceFormData({
                                                ...sourceFormData,
                                                rate: Number(e.target.value),
                                            })
                                        }
                                        min="0"
                                        step="0.01"
                                        style={{ display: 'block', width: '100%', padding: '5px' }}
                                    />
                                </label>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label>
                                    Fees (%) - Optional:
                                    <input
                                        type="number"
                                        value={sourceFormData.fees}
                                        onChange={(e) =>
                                            setSourceFormData({
                                                ...sourceFormData,
                                                fees: Number(e.target.value),
                                            })
                                        }
                                        min="0"
                                        step="0.01"
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
                                    onClick={() => setShowSourceModal(false)}
                                    style={{ padding: '8px 15px' }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Drawdown Modal */}
            {showDrawdownModal && (
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
                        <h2>Record Drawdown</h2>
                        <form onSubmit={handleCreateDrawdown}>
                            <div style={{ marginBottom: '15px' }}>
                                <label>
                                    Financing Source:
                                    <select
                                        value={drawdownFormData.sourceId}
                                        onChange={(e) =>
                                            setDrawdownFormData({ ...drawdownFormData, sourceId: e.target.value })
                                        }
                                        required
                                        style={{ display: 'block', width: '100%', padding: '5px' }}
                                    >
                                        <option value="">-- Select Source --</option>
                                        {sources.map((source) => (
                                            <option key={source.id} value={source.id}>
                                                {source.type} - {formatCurrency(source.amount)} (Available:{' '}
                                                {formatCurrency(source.remaining)})
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label>
                                    Drawdown Date:
                                    <input
                                        type="date"
                                        value={drawdownFormData.date}
                                        onChange={(e) =>
                                            setDrawdownFormData({ ...drawdownFormData, date: e.target.value })
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
                                        value={drawdownFormData.amount}
                                        onChange={(e) =>
                                            setDrawdownFormData({
                                                ...drawdownFormData,
                                                amount: Number(e.target.value),
                                            })
                                        }
                                        required
                                        min="0"
                                        step="0.01"
                                        style={{ display: 'block', width: '100%', padding: '5px' }}
                                    />
                                </label>
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="submit" style={{ padding: '8px 15px' }}>
                                    Record
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowDrawdownModal(false)}
                                    style={{ padding: '8px 15px' }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Financing Sources Table */}
            {selectedProjectId && (
                <>
                    <h2>Financing Sources</h2>
                    {loading ? (
                        <p>Loading...</p>
                    ) : sources.length === 0 ? (
                        <p>No financing sources yet. Add one to get started.</p>
                    ) : (
                        <table border={1} cellPadding={10} style={{ width: '100%', marginBottom: '40px' }}>
                            <thead style={{ backgroundColor: '#f5f5f5' }}>
                                <tr>
                                    <th>Type</th>
                                    <th style={{ textAlign: 'right' }}>Total Amount</th>
                                    <th style={{ textAlign: 'right' }}>Drawn</th>
                                    <th style={{ textAlign: 'right' }}>Remaining</th>
                                    <th>Rate</th>
                                    <th>Fees</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sources.map((source) => (
                                    <tr key={source.id}>
                                        <td>{source.type}</td>
                                        <td style={{ textAlign: 'right' }}>{formatCurrency(source.amount)}</td>
                                        <td style={{ textAlign: 'right', color: '#ef4444' }}>
                                            {formatCurrency(source.totalDrawn)}
                                        </td>
                                        <td style={{ textAlign: 'right', color: '#22c55e' }}>
                                            {formatCurrency(source.remaining)}
                                        </td>
                                        <td>{source.rate ? `${source.rate}%` : '-'}</td>
                                        <td>{source.fees ? `${source.fees}%` : '-'}</td>
                                        <td>
                                            <button
                                                onClick={() => handleDeleteSource(source.id)}
                                                style={{ padding: '5px 10px' }}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {/* Drawdowns Table */}
                    <h2>Drawdown History</h2>
                    {drawdowns.length === 0 ? (
                        <p>No drawdowns recorded yet.</p>
                    ) : (
                        <table border={1} cellPadding={10} style={{ width: '100%' }}>
                            <thead style={{ backgroundColor: '#f5f5f5' }}>
                                <tr>
                                    <th>Date</th>
                                    <th>Source Type</th>
                                    <th style={{ textAlign: 'right' }}>Amount</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {drawdowns.map((drawdown) => (
                                    <tr key={drawdown.id}>
                                        <td>{new Date(drawdown.date).toLocaleDateString()}</td>
                                        <td>{drawdown.source?.type || '-'}</td>
                                        <td style={{ textAlign: 'right', color: '#22c55e' }}>
                                            {formatCurrency(drawdown.amount)}
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => handleDeleteDrawdown(drawdown.id)}
                                                style={{ padding: '5px 10px' }}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </>
            )}
        </div>
    );
}
