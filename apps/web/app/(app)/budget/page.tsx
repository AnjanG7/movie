'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = 'http://localhost:4000/api';

interface Project {
  id: string;
  title: string;
  baseCurrency: string;
}

interface BudgetVersion {
  id: string;
  version: string;
  type: string;
  grandTotal: number;
  createdAt: string;
  lockedAt?: string;
  lines: BudgetLine[];
}

interface BudgetLine {
  id: string;
  phase: string;
  department: string | null;
  name: string;
  qty: number;
  rate: number;
  taxPercent: number;
}

export default function BudgetPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [budgetVersions, setBudgetVersions] = useState<BudgetVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<BudgetVersion | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddLineModal, setShowAddLineModal] = useState(false);
  const [editingLine, setEditingLine] = useState<BudgetLine | null>(null);

  const [lineFormData, setLineFormData] = useState({
    phase: 'PRODUCTION',
    department: '',
    name: '',
    qty: 1,
    rate: 0,
    taxPercent: 0,
    vendor: '',
    notes: '',
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchBudgetVersions();
    }
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects?limit=1000`, {
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

  const fetchBudgetVersions = async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/budget`,
        { credentials: 'include' }
      );
      const result = await response.json();
      if (result.success) {
        setBudgetVersions(result.data.versions || []);
        // Auto-select working budget if exists
        const workingBudget = result.data.versions?.find(
          (v: BudgetVersion) => v.type === 'WORKING'
        );
        if (workingBudget) {
          setSelectedVersion(workingBudget);
        }
      }
    } catch (error) {
      console.error('Error fetching budget versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLine = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedVersion) {
      alert('Please select a budget version first');
      return;
    }

    try {
      const endpoint = editingLine
        ? `${API_BASE_URL}/projects/${selectedProjectId}/budget/${selectedVersion.id}/lines/${editingLine.id}`
        : `${API_BASE_URL}/projects/${selectedProjectId}/budget/${selectedVersion.id}/lines`;

      const method = editingLine ? 'PATCH' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(lineFormData),
      });

      const result = await response.json();
      if (result.success) {
        alert(editingLine ? 'Line updated successfully' : 'Line added successfully');
        setShowAddLineModal(false);
        setEditingLine(null);
        resetLineForm();
        fetchBudgetVersions();
      } else {
        alert(result.message || 'Failed to save line');
      }
    } catch (error) {
      console.error('Error saving line:', error);
      alert('Failed to save line');
    }
  };

  const handleEditLine = (line: BudgetLine) => {
    setEditingLine(line);
    setLineFormData({
      phase: line.phase,
      department: line.department || '',
      name: line.name,
      qty: line.qty,
      rate: line.rate,
      taxPercent: line.taxPercent,
      vendor: '',
      notes: '',
    });
    setShowAddLineModal(true);
  };

  const handleDeleteLine = async (lineId: string) => {
    if (!confirm('Delete this budget line?')) return;

    if (!selectedVersion) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/budget/${selectedVersion.id}/lines/${lineId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      const result = await response.json();
      if (result.success) {
        alert('Line deleted successfully');
        fetchBudgetVersions();
      } else {
        alert(result.message || 'Failed to delete line');
      }
    } catch (error) {
      console.error('Error deleting line:', error);
      alert('Failed to delete line');
    }
  };

  const resetLineForm = () => {
    setLineFormData({
      phase: 'PRODUCTION',
      department: '',
      name: '',
      qty: 1,
      rate: 0,
      taxPercent: 0,
      vendor: '',
      notes: '',
    });
  };

const formatCurrency = (amount: number) => {
  const project = projects.find((p) => p.id === selectedProjectId);
  const currency = project?.baseCurrency || 'USD';
  return `${currency} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2, // Fixed typo here
  })}`;
};

  const calculateLineTotal = (line: BudgetLine) => {
    return line.qty * line.rate * (1 + line.taxPercent / 100);
  };

 const calculateTotalsByPhase = () => {
  if (!selectedVersion) return {};

  const totals: Record<string, number> = {};
  selectedVersion.lines.forEach((line) => {
    const lineTotal = calculateLineTotal(line);
    const phase = line.phase;
    if (totals[phase] === undefined) {
      totals[phase] = 0;
    }
    totals[phase] += lineTotal;
  });
  return totals;
};


  const calculateGrandTotal = () => {
    if (!selectedVersion) return 0;
    return selectedVersion.lines.reduce((sum, line) => sum + calculateLineTotal(line), 0);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Budget Management</h1>

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

        {selectedProjectId && budgetVersions.length > 0 && (
          <label>
            Budget Version:
            <select
              value={selectedVersion?.id || ''}
              onChange={(e) => {
                const version = budgetVersions.find((v) => v.id === e.target.value);
                setSelectedVersion(version || null);
              }}
              style={{ marginLeft: '10px', padding: '5px' }}
            >
              <option value="">-- Select Version --</option>
              {budgetVersions.map((version) => (
                <option key={version.id} value={version.id}>
                  {version.version} ({version.type})
                </option>
              ))}
            </select>
          </label>
        )}

        {selectedVersion && !selectedVersion.lockedAt && (
          <button
            onClick={() => {
              setEditingLine(null);
              resetLineForm();
              setShowAddLineModal(true);
            }}
            style={{ padding: '8px 15px' }}
          >
            Add Budget Line
          </button>
        )}
      </div>

      {/* Add/Edit Line Modal */}
      {showAddLineModal && (
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
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '30px',
              width: '600px',
              maxHeight: '90vh',
              overflow: 'auto',
              borderRadius: '8px',
            }}
          >
            <h2>{editingLine ? 'Edit Budget Line' : 'Add Budget Line'}</h2>
            <form onSubmit={handleAddLine}>
              <div style={{ marginBottom: '15px' }}>
                <label>
                  <strong>Phase:</strong>
                  <select
                    value={lineFormData.phase}
                    onChange={(e) =>
                      setLineFormData({ ...lineFormData, phase: e.target.value })
                    }
                    required
                    style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px' }}
                  >
                    <option value="DEVELOPMENT">Development</option>
                    <option value="PRODUCTION">Production</option>
                    <option value="POST">Post-Production</option>
                    <option value="PUBLICITY">Publicity</option>
                  </select>
                </label>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label>
                  <strong>Department (Optional):</strong>
                  <input
                    type="text"
                    value={lineFormData.department}
                    onChange={(e) =>
                      setLineFormData({ ...lineFormData, department: e.target.value })
                    }
                    placeholder="e.g., Camera, Lighting, Art Dept"
                    style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px' }}
                  />
                </label>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label>
                  <strong>Line Item Name:</strong>
                  <input
                    type="text"
                    value={lineFormData.name}
                    onChange={(e) =>
                      setLineFormData({ ...lineFormData, name: e.target.value })
                    }
                    required
                    placeholder="e.g., Director Fee, Camera Rental"
                    style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px' }}
                  />
                </label>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '10px',
                  marginBottom: '15px',
                }}
              >
                <label>
                  <strong>Qty:</strong>
                  <input
                    type="number"
                    value={lineFormData.qty}
                    onChange={(e) =>
                      setLineFormData({ ...lineFormData, qty: Number(e.target.value) })
                    }
                    required
                    min="1"
                    style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px' }}
                  />
                </label>

                <label>
                  <strong>Rate:</strong>
                  <input
                    type="number"
                    value={lineFormData.rate}
                    onChange={(e) =>
                      setLineFormData({ ...lineFormData, rate: Number(e.target.value) })
                    }
                    required
                    min="0"
                    step="0.01"
                    style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px' }}
                  />
                </label>

                <label>
                  <strong>Tax %:</strong>
                  <input
                    type="number"
                    value={lineFormData.taxPercent}
                    onChange={(e) =>
                      setLineFormData({
                        ...lineFormData,
                        taxPercent: Number(e.target.value),
                      })
                    }
                    min="0"
                    step="0.1"
                    style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px' }}
                  />
                </label>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label>
                  <strong>Vendor (Optional):</strong>
                  <input
                    type="text"
                    value={lineFormData.vendor}
                    onChange={(e) =>
                      setLineFormData({ ...lineFormData, vendor: e.target.value })
                    }
                    placeholder="Vendor name"
                    style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px' }}
                  />
                </label>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label>
                  <strong>Notes (Optional):</strong>
                  <textarea
                    value={lineFormData.notes}
                    onChange={(e) =>
                      setLineFormData({ ...lineFormData, notes: e.target.value })
                    }
                    placeholder="Additional notes"
                    rows={3}
                    style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px' }}
                  />
                </label>
              </div>

              <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                <strong>Line Total:</strong>{' '}
                {formatCurrency(
                  lineFormData.qty *
                    lineFormData.rate *
                    (1 + lineFormData.taxPercent / 100)
                )}
              </p>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ padding: '10px 20px' }}>
                  {editingLine ? 'Update' : 'Add'} Line
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddLineModal(false);
                    setEditingLine(null);
                    resetLineForm();
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

      {/* Budget Display */}
      {selectedProjectId && (
        <div>
          {loading ? (
            <p>Loading...</p>
          ) : !selectedVersion ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
              }}
            >
              <p style={{ fontSize: '16px', color: '#666', marginBottom: '10px' }}>
                No budget version found for this project.
              </p>
              <p style={{ fontSize: '14px', color: '#999' }}>
                Create a quotation first, then convert it to a baseline budget.
              </p>
              <button
                onClick={() => router.push(`/quotations?projectId=${selectedProjectId}`)}
                style={{ marginTop: '20px', padding: '10px 20px' }}
              >
                Go to Quotations
              </button>
            </div>
          ) : (
            <>
              {/* Budget Header */}
              <div
                style={{
                  marginBottom: '20px',
                  padding: '20px',
                  backgroundColor: '#f0f8ff',
                  borderRadius: '8px',
                }}
              >
                <h2 style={{ margin: '0 0 10px 0' }}>
                  {selectedVersion.version} ({selectedVersion.type})
                </h2>
                <p style={{ margin: 0, color: '#666' }}>
                  Created: {new Date(selectedVersion.createdAt).toLocaleDateString()}
                  {selectedVersion.lockedAt && (
                    <span style={{ marginLeft: '20px', color: '#ef4444' }}>
                      🔒 Locked
                    </span>
                  )}
                </p>
              </div>

              {/* Summary by Phase */}
              <div style={{ marginBottom: '30px' }}>
                <h3>Summary by Phase</h3>
                <table
                  border={1}
                  cellPadding={10}
                  style={{ width: '100%', borderCollapse: 'collapse' }}
                >
                  <thead style={{ backgroundColor: '#4472C4', color: 'white' }}>
                    <tr>
                      <th>Phase</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                      <th style={{ textAlign: 'right' }}>% of Budget</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(calculateTotalsByPhase()).map(([phase, total]) => (
                      <tr key={phase}>
                        <td><strong>{phase}</strong></td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(total)}</td>
                        <td style={{ textAlign: 'right' }}>
                          {((total / calculateGrandTotal()) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot style={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>
                    <tr>
                      <td>TOTAL</td>
                      <td style={{ textAlign: 'right', color: '#4472C4' }}>
                        {formatCurrency(calculateGrandTotal())}
                      </td>
                      <td style={{ textAlign: 'right' }}>100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Detailed Budget Lines */}
              <div>
                <h3>Budget Lines ({selectedVersion.lines.length})</h3>
                {selectedVersion.lines.length === 0 ? (
                  <p>No budget lines yet. Add your first line item above.</p>
                ) : (
                  <table
                    border={1}
                    cellPadding={8}
                    style={{ width: '100%', borderCollapse: 'collapse' }}
                  >
                    <thead style={{ backgroundColor: '#f5f5f5' }}>
                      <tr>
                        <th>Phase</th>
                        <th>Department</th>
                        <th>Line Item</th>
                        <th style={{ textAlign: 'right' }}>Qty</th>
                        <th style={{ textAlign: 'right' }}>Rate</th>
                        <th style={{ textAlign: 'right' }}>Tax %</th>
                        <th style={{ textAlign: 'right' }}>Total</th>
                        {!selectedVersion.lockedAt && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedVersion.lines.map((line) => (
                        <tr key={line.id}>
                          <td>{line.phase}</td>
                          <td>{line.department || '-'}</td>
                          <td>{line.name}</td>
                          <td style={{ textAlign: 'right' }}>{line.qty}</td>
                          <td style={{ textAlign: 'right' }}>
                            {line.rate.toLocaleString()}
                          </td>
                          <td style={{ textAlign: 'right' }}>{line.taxPercent}%</td>
                          <td style={{ textAlign: 'right' }}>
                            {formatCurrency(calculateLineTotal(line))}
                          </td>
                          {!selectedVersion.lockedAt && (
                            <td>
                              <button
                                onClick={() => handleEditLine(line)}
                                style={{ padding: '5px 10px', marginRight: '5px' }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteLine(line.id)}
                                style={{ padding: '5px 10px' }}
                              >
                                Delete
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
