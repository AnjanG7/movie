'use client';

import { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:4000/api';

interface Project {
  id: string;
  title: string;
  baseCurrency: string;
}

interface VarianceLine {
  id: string;
  name: string;
  phase: string;
  department: string | null;
  budgeted: number;
  committed: number;
  spent: number;
  variance: number;
  variancePercent: number;
}

interface PhaseData {
  budgeted: number;
  committed: number;
  spent: number;
  variance: number;
}

interface VarianceReport {
  summary: {
    totalBudgeted: number;
    totalCommitted: number;
    totalSpent: number;
    totalVariance: number;
    overBudgetLines: number;
    underBudgetLines: number;
  };
  byPhase: Record<string, PhaseData>;
  lines: VarianceLine[];
}

export default function BudgetVariancePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [report, setReport] = useState<VarianceReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchVarianceReport();
    }
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects?limit=9999`, {
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

  const fetchVarianceReport = async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/budget-lines/variance-report`,
        { credentials: 'include' }
      );
      const result = await response.json();
      if (result.success) {
        setReport(result.data);
      }
    } catch (error) {
      console.error('Error fetching variance report:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    const project = projects.find((p) => p.id === selectedProjectId);
    const currency = project?.baseCurrency || 'USD';
    return `${currency} ${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getVarianceColor = (variance: number) => {
    if (variance < 0) return '#ef4444'; // Over budget - red
    if (variance > 0) return '#22c55e'; // Under budget - green
    return '#6b7280'; // Exact - gray
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Budget vs Actuals - Variance Report</h1>

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
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : !report ? (
        <p>Select a project to view variance report</p>
      ) : (
        <>
          {/* Summary Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '20px',
              marginBottom: '30px',
            }}
          >
            <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>
                Total Budgeted
              </h3>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
                {formatCurrency(report.summary.totalBudgeted)}
              </p>
            </div>

            <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>
                Total Committed
              </h3>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
                {formatCurrency(report.summary.totalCommitted)}
              </p>
            </div>

            <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>
                Total Spent
              </h3>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
                {formatCurrency(report.summary.totalSpent)}
              </p>
            </div>

            <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>
                Total Variance
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: getVarianceColor(report.summary.totalVariance),
                }}
              >
                {formatCurrency(report.summary.totalVariance)}
              </p>
            </div>
          </div>

          {/* Alerts */}
          {report.summary.overBudgetLines > 0 && (
            <div
              style={{
                marginBottom: '20px',
                padding: '15px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
              }}
            >
              <p style={{ margin: 0, color: '#dc2626', fontWeight: 'bold' }}>
                ⚠️ {report.summary.overBudgetLines} budget line(s) are over budget
              </p>
            </div>
          )}

          {/* By Phase Summary */}
          <h2>Variance by Phase</h2>
          <table
            border={1}
            cellPadding={10}
            style={{ width: '100%', marginBottom: '30px', borderCollapse: 'collapse' }}
          >
            <thead style={{ backgroundColor: '#f5f5f5' }}>
              <tr>
                <th>Phase</th>
                <th style={{ textAlign: 'right' }}>Budgeted</th>
                <th style={{ textAlign: 'right' }}>Committed</th>
                <th style={{ textAlign: 'right' }}>Spent</th>
                <th style={{ textAlign: 'right' }}>Variance</th>
                <th style={{ textAlign: 'right' }}>Variance %</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(report.byPhase).map(([phase, data]) => {
                const variancePercent =
                  data.budgeted > 0 ? ((data.variance / data.budgeted) * 100).toFixed(1) : '0';
                return (
                  <tr key={phase}>
                    <td><strong>{phase}</strong></td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(data.budgeted)}</td>
                    <td style={{ textAlign: 'right', color: '#f59e0b' }}>
                      {formatCurrency(data.committed)}
                    </td>
                    <td style={{ textAlign: 'right', color: '#ef4444' }}>
                      {formatCurrency(data.spent)}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        fontWeight: 'bold',
                        color: getVarianceColor(data.variance),
                      }}
                    >
                      {formatCurrency(data.variance)}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        color: getVarianceColor(data.variance),
                      }}
                    >
                      {variancePercent}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Lines with Significant Variance (>10%) */}
          <h2>Lines with Significant Variance (&gt;10%)</h2>
          {report.lines.length === 0 ? (
            <p>No significant variances detected. All lines are within 10% of budget.</p>
          ) : (
            <table
              border={1}
              cellPadding={10}
              style={{ width: '100%', borderCollapse: 'collapse' }}
            >
              <thead style={{ backgroundColor: '#f5f5f5' }}>
                <tr>
                  <th>Phase</th>
                  <th>Department</th>
                  <th>Line Item</th>
                  <th style={{ textAlign: 'right' }}>Budgeted</th>
                  <th style={{ textAlign: 'right' }}>Spent</th>
                  <th style={{ textAlign: 'right' }}>Variance</th>
                  <th style={{ textAlign: 'right' }}>Variance %</th>
                </tr>
              </thead>
              <tbody>
                {report.lines.map((line) => (
                  <tr
                    key={line.id}
                    style={{
                      backgroundColor: line.variance < 0 ? '#fee' : 'transparent',
                    }}
                  >
                    <td>{line.phase}</td>
                    <td>{line.department || '-'}</td>
                    <td>{line.name}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(line.budgeted)}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(line.spent)}</td>
                    <td
                      style={{
                        textAlign: 'right',
                        fontWeight: 'bold',
                        color: getVarianceColor(line.variance),
                      }}
                    >
                      {formatCurrency(line.variance)}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        color: getVarianceColor(line.variance),
                      }}
                    >
                      {line.variancePercent.toFixed(1)}%
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
