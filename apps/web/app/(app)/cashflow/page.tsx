'use client';

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_BASE_URL = 'http://localhost:4000/api';

interface CashflowForecast {
  id: string;
  projectId: string;
  weekStart: string;
  inflows: number;
  outflows: number;
  cumulative: number;
}

interface Project {
  id: string;
  title: string;
  baseCurrency: string;
}

interface Alert {
  type: 'SHORTFALL' | 'LOW_BALANCE';
  week: string;
  amount: number;
  message: string;
}

interface Summary {
  totalInflows: number;
  totalOutflows: number;
  netCashflow: number;
  currentBalance: number;
  shortfalls: number;
  lowBalanceWeeks: number;
  alerts: Alert[];
}

export default function CashflowPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [forecasts, setForecasts] = useState<CashflowForecast[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [weeks, setWeeks] = useState(12);
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    weekStart: new Date().toISOString().split('T')[0],
    inflows: 0,
    outflows: 0,
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchCashflow();
      fetchSummary();
    }
  }, [selectedProjectId, weeks]);

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

  const fetchCashflow = async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/cashflow?weeks=${weeks}`,
        { credentials: 'include' }
      );
      const result = await response.json();
      if (result.success) {
        setForecasts(result.data);
      }
    } catch (error) {
      console.error('Error fetching cashflow:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    if (!selectedProjectId) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/cashflow/summary`,
        { credentials: 'include' }
      );
      const result = await response.json();
      if (result.success) {
        setSummary(result.data);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const handleAutoCompute = async () => {
    if (!selectedProjectId) return;
    if (!confirm('This will auto-compute cashflow from financing and scheduled payments. Continue?'))
      return;

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/cashflow/auto-compute?weeks=${weeks}`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      const result = await response.json();
      if (result.success) {
        alert('Cashflow auto-computed successfully');
        fetchCashflow();
        fetchSummary();
      } else {
        alert(result.message || 'Failed to auto-compute');
      }
    } catch (error) {
      console.error('Error auto-computing:', error);
      alert('Failed to auto-compute cashflow');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/cashflow`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();
      if (result.success) {
        alert('Cashflow entry saved');
        setShowAddModal(false);
        setFormData({
          weekStart: new Date().toISOString().split('T')[0],
          inflows: 0,
          outflows: 0,
        });
        fetchCashflow();
        fetchSummary();
      } else {
        alert(result.message || 'Failed to save entry');
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('Failed to save entry');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this cashflow entry?')) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/${selectedProjectId}/cashflow/${id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      const result = await response.json();
      if (result.success) {
        alert('Entry deleted');
        fetchCashflow();
        fetchSummary();
      } else {
        alert(result.message || 'Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete entry');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const exportToExcel = () => {
    if (forecasts.length === 0) {
      alert('No data to export');
      return;
    }

    const project = projects.find((p) => p.id === selectedProjectId);
    const currency = project?.baseCurrency || 'USD';

    // Prepare data for Excel
    const excelData = forecasts.map((forecast) => ({
      'Week Starting': formatDate(forecast.weekStart),
      [`Inflows (${currency})`]: forecast.inflows,
      [`Outflows (${currency})`]: forecast.outflows,
      [`Net (${currency})`]: forecast.inflows - forecast.outflows,
      [`Cumulative Balance (${currency})`]: forecast.cumulative,
      Status:
        forecast.cumulative < 0
          ? 'Shortfall'
          : forecast.cumulative < 10000
            ? 'Low Balance'
            : 'OK',
    }));

    // Add summary at the end
    excelData.push({
      'Week Starting': '',
      [`Inflows (${currency})`]: '',
      [`Outflows (${currency})`]: '',
      [`Net (${currency})`]: '',
      [`Cumulative Balance (${currency})`]: '',
      Status: '',
    });

    excelData.push({
      'Week Starting': 'SUMMARY',
      [`Inflows (${currency})`]: summary?.totalInflows || 0,
      [`Outflows (${currency})`]: summary?.totalOutflows || 0,
      [`Net (${currency})`]: summary?.netCashflow || 0,
      [`Cumulative Balance (${currency})`]: summary?.currentBalance || 0,
      Status: '',
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // Week Starting
      { wch: 15 }, // Inflows
      { wch: 15 }, // Outflows
      { wch: 15 }, // Net
      { wch: 20 }, // Cumulative Balance
      { wch: 15 }, // Status
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cashflow Forecast');

    // Add project info sheet
    const projectInfo = [
      ['Project', project?.title || ''],
      ['Currency', currency],
      ['Report Date', new Date().toLocaleDateString()],
      ['Weeks Covered', forecasts.length],
      [''],
      ['Total Inflows', summary?.totalInflows || 0],
      ['Total Outflows', summary?.totalOutflows || 0],
      ['Net Cashflow', summary?.netCashflow || 0],
      ['Current Balance', summary?.currentBalance || 0],
      ['Shortfall Weeks', summary?.shortfalls || 0],
      ['Low Balance Weeks', summary?.lowBalanceWeeks || 0],
    ];

    const wsInfo = XLSX.utils.aoa_to_sheet(projectInfo);
    XLSX.utils.book_append_sheet(wb, wsInfo, 'Summary');

    // Generate filename
    const filename = `Cashflow_${project?.title || 'Report'}_${new Date().toISOString().split('T')[0]
      }.xlsx`;

    // Download
    XLSX.writeFile(wb, filename);
  };

  const exportToPDF = () => {
    if (forecasts.length === 0) {
      alert('No data to export');
      return;
    }

    const project = projects.find((p) => p.id === selectedProjectId);
    const currency = project?.baseCurrency || 'USD';

    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text('Cashflow Forecast Report', 14, 20);

    // Add project info
    doc.setFontSize(11);
    doc.text(`Project: ${project?.title || 'N/A'}`, 14, 30);
    doc.text(`Currency: ${currency}`, 14, 36);
    doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 14, 42);
    doc.text(`Weeks Covered: ${forecasts.length}`, 14, 48);

    // Add summary box
    doc.setFillColor(240, 240, 240);
    doc.rect(14, 55, 180, 35, 'F');
    doc.setFontSize(10);
    doc.text('Summary', 16, 62);
    doc.text(
      `Total Inflows: ${formatCurrency(summary?.totalInflows || 0)}`,
      16,
      69
    );
    doc.text(
      `Total Outflows: ${formatCurrency(summary?.totalOutflows || 0)}`,
      16,
      76
    );
    doc.text(
      `Net Cashflow: ${formatCurrency(summary?.netCashflow || 0)}`,
      16,
      83
    );
    doc.text(
      `Current Balance: ${formatCurrency(summary?.currentBalance || 0)}`,
      120,
      69
    );
    doc.text(`Shortfall Weeks: ${summary?.shortfalls || 0}`, 120, 76);
    doc.text(`Low Balance Weeks: ${summary?.lowBalanceWeeks || 0}`, 120, 83);

    // Add forecast table
    const tableData = forecasts.map((forecast) => [
      formatDate(forecast.weekStart),
      forecast.inflows.toFixed(2),
      forecast.outflows.toFixed(2),
      (forecast.inflows - forecast.outflows).toFixed(2),
      forecast.cumulative.toFixed(2),
      forecast.cumulative < 0
        ? 'Shortfall'
        : forecast.cumulative < 10000
          ? 'Low'
          : 'OK',
    ]);

    autoTable(doc, {
      startY: 95,
      head: [
        ['Week Starting', 'Inflows', 'Outflows', 'Net', 'Cumulative', 'Status'],
      ],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202] },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
      },
  didParseCell: function (data) {
  // Highlight shortfall rows
  if (data.section === 'body' && data.column.index === 5 && data.row.cells) {
    if (data.cell.raw === 'Shortfall') {
      const fillColor: [number, number, number] = [255, 200, 200];
      if (data.row.cells[0]) data.row.cells[0].styles.fillColor = fillColor;
      if (data.row.cells[1]) data.row.cells[1].styles.fillColor = fillColor;
      if (data.row.cells[2]) data.row.cells[2].styles.fillColor = fillColor;
      if (data.row.cells[3]) data.row.cells[3].styles.fillColor = fillColor;
      if (data.row.cells[4]) data.row.cells[4].styles.fillColor = fillColor;
      if (data.row.cells[5]) data.row.cells[5].styles.fillColor = fillColor;
    }
  }
},

    });

    // Add alerts section if any
    if (summary && summary.alerts.length > 0) {
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.setTextColor(220, 38, 38);
      doc.text('⚠ Alerts', 14, finalY);

      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      let alertY = finalY + 7;

      summary.alerts.slice(0, 10).forEach((alert, index) => {
        doc.text(
          `${index + 1}. Week ${formatDate(alert.week)}: ${alert.message}`,
          16,
          alertY
        );
        alertY += 6;
      });

      if (summary.alerts.length > 10) {
        doc.text(
          `... and ${summary.alerts.length - 10} more alerts`,
          16,
          alertY
        );
      }
    }

    // Add footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
      doc.text(
        `Generated on ${new Date().toLocaleString()}`,
        14,
        doc.internal.pageSize.height - 10
      );
    }

    // Generate filename
    const filename = `Cashflow_${project?.title || 'Report'}_${new Date().toISOString().split('T')[0]
      }.pdf`;

    // Download
    doc.save(filename);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Cashflow Management</h1>

      {/* Project Selector */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
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

        <div>
          <label>
            Weeks to Show:
            <input
              type="number"
              value={weeks}
              onChange={(e) => setWeeks(parseInt(e.target.value) || 12)}
              min="1"
              max="52"
              style={{ marginLeft: '10px', padding: '5px', width: '80px' }}
            />
          </label>
        </div>

        {selectedProjectId && (
          <>
            <button onClick={() => setShowAddModal(true)} style={{ padding: '8px 15px' }}>
              Add Manual Entry
            </button>
            <button onClick={handleAutoCompute} style={{ padding: '8px 15px' }}>
              Auto-Compute
            </button>
            <a
              href={`/financing-sources?projectId=${selectedProjectId}`}
              style={{ padding: '8px 15px', textDecoration: 'none', border: '1px solid #ccc', borderRadius: '4px' }}
            >
              Manage Financing
            </a>

            {/* Export Buttons */}
            {forecasts.length > 0 && (
              <>
                <button
                  onClick={exportToExcel}
                  style={{ padding: '8px 15px', backgroundColor: '#22c55e', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                >
                  📊 Export to Excel
                </button>
                <button
                  onClick={exportToPDF}
                  style={{ padding: '8px 15px', backgroundColor: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                >
                  📄 Export to PDF
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Add Entry Modal */}
      {showAddModal && (
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
          <div style={{ backgroundColor: 'white', padding: '30px', width: '500px', borderRadius: '8px' }}>
            <h2>Add Cashflow Entry</h2>
            <form onSubmit={handleAddEntry}>
              <div style={{ marginBottom: '15px' }}>
                <label>
                  Week Start Date:
                  <input
                    type="date"
                    value={formData.weekStart}
                    onChange={(e) =>
                      setFormData({ ...formData, weekStart: e.target.value })
                    }
                    required
                    style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px' }}
                  />
                </label>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label>
                  Inflows:
                  <input
                    type="number"
                    value={formData.inflows}
                    onChange={(e) =>
                      setFormData({ ...formData, inflows: Number(e.target.value) })
                    }
                    min="0"
                    step="0.01"
                    required
                    style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px' }}
                  />
                </label>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label>
                  Outflows:
                  <input
                    type="number"
                    value={formData.outflows}
                    onChange={(e) =>
                      setFormData({ ...formData, outflows: Number(e.target.value) })
                    }
                    min="0"
                    step="0.01"
                    required
                    style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px' }}
                  />
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer' }}>
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '10px 20px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {summary && selectedProjectId && (
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
              Total Inflows
            </h3>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>
              {formatCurrency(summary.totalInflows)}
            </p>
          </div>

          <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>
              Total Outflows
            </h3>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
              {formatCurrency(summary.totalOutflows)}
            </p>
          </div>

          <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>
              Net Cashflow
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: 'bold',
                color: summary.netCashflow >= 0 ? '#22c55e' : '#ef4444',
              }}
            >
              {formatCurrency(summary.netCashflow)}
            </p>
          </div>

          <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>
              Current Balance
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: 'bold',
                color: summary.currentBalance >= 0 ? '#22c55e' : '#ef4444',
              }}
            >
              {formatCurrency(summary.currentBalance)}
            </p>
          </div>
        </div>
      )}

      {/* Alerts */}
      {summary && summary.alerts.length > 0 && (
        <div
          style={{
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
          }}
        >
          <h3 style={{ margin: '0 0 10px 0', color: '#dc2626' }}>
            ⚠️ Cashflow Alerts ({summary.alerts.length})
          </h3>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {summary.alerts.map((alert, index) => (
              <li key={index} style={{ marginBottom: '5px' }}>
                <strong>Week of {formatDate(alert.week)}:</strong> {alert.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Cashflow Table */}
      {selectedProjectId && (
        <>
          {loading ? (
            <p>Loading...</p>
          ) : forecasts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
              <p style={{ fontSize: '16px', color: '#666', marginBottom: '10px' }}>No cashflow data yet.</p>
              <p style={{ fontSize: '14px', color: '#999' }}>
                Click "Auto-Compute" to generate from financing sources and scheduled payments,
                or add manual entries.
              </p>
            </div>
          ) : (
            <div style={{ overflow: 'auto' }}>
              <table border={1} cellPadding={10} style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f5f5f5' }}>
                  <tr>
                    <th>Week Starting</th>
                    <th style={{ textAlign: 'right' }}>Inflows</th>
                    <th style={{ textAlign: 'right' }}>Outflows</th>
                    <th style={{ textAlign: 'right' }}>Net</th>
                    <th style={{ textAlign: 'right' }}>Cumulative Balance</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {forecasts.map((forecast) => {
                    const net = forecast.inflows - forecast.outflows;
                    const isNegative = forecast.cumulative < 0;
                    return (
                      <tr
                        key={forecast.id}
                        style={{
                          backgroundColor: isNegative ? '#fee' : 'transparent',
                        }}
                      >
                        <td>{formatDate(forecast.weekStart)}</td>
                        <td style={{ textAlign: 'right', color: '#22c55e' }}>
                          {formatCurrency(forecast.inflows)}
                        </td>
                        <td style={{ textAlign: 'right', color: '#ef4444' }}>
                          {formatCurrency(forecast.outflows)}
                        </td>
                        <td
                          style={{
                            textAlign: 'right',
                            color: net >= 0 ? '#22c55e' : '#ef4444',
                          }}
                        >
                          {formatCurrency(net)}
                        </td>
                        <td
                          style={{
                            textAlign: 'right',
                            fontWeight: 'bold',
                            color: forecast.cumulative >= 0 ? '#22c55e' : '#ef4444',
                          }}
                        >
                          {formatCurrency(forecast.cumulative)}
                        </td>
                        <td>
                          {isNegative ? (
                            <span style={{ color: '#ef4444', fontWeight: 'bold' }}>
                              ⚠️ Shortfall
                            </span>
                          ) : forecast.cumulative < 10000 ? (
                            <span style={{ color: '#f59e0b' }}>⚠️ Low Balance</span>
                          ) : (
                            <span style={{ color: '#22c55e' }}>✓ OK</span>
                          )}
                        </td>
                        <td>
                          <button
                            onClick={() => handleDelete(forecast.id)}
                            style={{ padding: '5px 10px', cursor: 'pointer' }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot style={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>
                  <tr>
                    <td>Total</td>
                    <td style={{ textAlign: 'right', color: '#22c55e' }}>
                      {formatCurrency(
                        forecasts.reduce((sum, f) => sum + f.inflows, 0)
                      )}
                    </td>
                    <td style={{ textAlign: 'right', color: '#ef4444' }}>
                      {formatCurrency(
                        forecasts.reduce((sum, f) => sum + f.outflows, 0)
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {formatCurrency(
                        forecasts.reduce((sum, f) => sum + (f.inflows - f.outflows), 0)
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {forecasts.length > 0
                        ? formatCurrency(forecasts[forecasts.length - 1]!.cumulative)
                        : '-'}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
