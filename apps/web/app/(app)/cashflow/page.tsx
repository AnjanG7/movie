'use client';

import React, {
  useState,
  useEffect,
  FormEvent,
  ChangeEvent,
} from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

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

type AlertType = 'SHORTFALL' | 'LOW_BALANCE';

interface Alert {
  type: AlertType;
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

interface CashflowForm {
  weekStart: string;
  inflows: number;
  outflows: number;
}

export default function CashflowPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [forecasts, setForecasts] = useState<CashflowForecast[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [weeks, setWeeks] = useState(12);
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState<CashflowForm>({
    weekStart: new Date().toISOString().split('T')[0] as string,
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
        setProjects(result.data.projects || []);

         const params = new URLSearchParams(window.location.search);
      const projectId = params.get('projectId');
      if (projectId) {
        setSelectedProjectId(projectId);
      }
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
        setForecasts(result.data || []);
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
        setSummary(result.data as Summary);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const handleAutoCompute = async () => {
    if (!selectedProjectId) return;
    if (
      !confirm(
        'This will auto-compute cashflow from financing and scheduled payments. Continue?'
      )
    )
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

  const handleAddEntry = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProjectId) return;

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
          weekStart: new Date().toISOString().split('T')[0] as string,
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
    if (!selectedProjectId) return;

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

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString();

  const handleWeeksChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setWeeks(Number.isNaN(value) ? 12 : value);
  };

  const handleProjectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedProjectId(e.target.value);
  };

  const handleFormChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'inflows' || name === 'outflows') {
      setFormData((prev) => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const exportToExcel = () => {
    if (forecasts.length === 0) {
      alert('No data to export');
      return;
    }

    const project = projects.find((p) => p.id === selectedProjectId);
    const currency = project?.baseCurrency || 'USD';

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

    excelData.push({
      'Week Starting': '',
      [`Inflows (${currency})`]: '',
      [`Outflows (${currency})`]: '',
      [`Net (${currency})`]: '',
      [`Cumulative Balance (${currency})`]: '',
      Status: '',
    } as any);

    excelData.push({
      'Week Starting': 'SUMMARY',
      [`Inflows (${currency})`]: summary?.totalInflows || 0,
      [`Outflows (${currency})`]: summary?.totalOutflows || 0,
      [`Net (${currency})`]: summary?.netCashflow || 0,
      [`Cumulative Balance (${currency})`]: summary?.currentBalance || 0,
      Status: '',
    } as any);

    const ws = XLSX.utils.json_to_sheet(excelData);

    (ws as any)['!cols'] = [
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cashflow Forecast');

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

    const wsInfo = XLSX.utils.aoa_to_sheet(projectInfo as any[][]);
    XLSX.utils.book_append_sheet(wb, wsInfo, 'Summary');

    const filename = `Cashflow_${project?.title || 'Report'}_${
      new Date().toISOString().split('T')[0]
    }.xlsx`;

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

    doc.setFontSize(18);
    doc.text('Cashflow Forecast Report', 14, 20);

    doc.setFontSize(11);
    doc.text(`Project: ${project?.title || 'N/A'}`, 14, 30);
    doc.text(`Currency: ${currency}`, 14, 36);
    doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 14, 42);
    doc.text(`Weeks Covered: ${forecasts.length}`, 14, 48);

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
    doc.text(
      `Low Balance Weeks: ${summary?.lowBalanceWeeks || 0}`,
      120,
      83
    );

    const tableData: RowInput[] = forecasts.map((forecast) => [
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
      didParseCell: (data) => {
        if (
          data.section === 'body' &&
          data.column.index === 5 &&
          data.cell.raw === 'Shortfall'
        ) {
          const fillColor: [number, number, number] = [255, 200, 200];
          Object.values(data.row.cells).forEach((cell) => {
            cell.styles.fillColor = fillColor;
          });
        }
      },
    });

    if (summary && summary.alerts.length > 0) {
      // @ts-expect-error lastAutoTable is added by autoTable
      const finalY = doc.lastAutoTable.finalY + 10;
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

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
      doc.text(
        `Generated on ${new Date().toLocaleString()}`,
        14,
        doc.internal.pageSize.getHeight() - 10
      );
    }

    const filename = `Cashflow_${project?.title || 'Report'}_${
      new Date().toISOString().split('T')[0]
    }.pdf`;

    doc.save(filename);
  };

  const project = projects.find((p) => p.id === selectedProjectId);

  const chartData = forecasts.map((f) => ({
    week: formatDate(f.weekStart),
    inflows: f.inflows,
    outflows: f.outflows,
    net: f.inflows - f.outflows,
    cumulative: f.cumulative,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Cashflow Management
            </h1>
            <p className="text-slate-600">
              Weekly inflows, outflows, and runway visibility.
            </p>
          </div>
          {project && (
            <div className="px-4 py-2 rounded-xl bg-white/70 border border-slate-200 text-sm text-slate-700 shadow-sm">
              <div className="font-semibold">{project.title}</div>
              <div>Currency: {project.baseCurrency}</div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-white/80 rounded-2xl shadow-md border border-slate-200 p-4 mb-6 flex flex-wrap gap-4 items-center">
          <div>
            <label className="text-sm font-semibold text-slate-700 mr-2">
              Project
            </label>
            <select
              value={selectedProjectId}
              onChange={handleProjectChange}
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm bg-white"
            >
              <option value="">-- Select Project --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 mr-2">
              Weeks
            </label>
            <input
              type="number"
              min={1}
              max={52}
              value={weeks}
              onChange={handleWeeksChange}
              className="h-10 w-20 rounded-lg border border-slate-300 px-3 text-sm"
            />
          </div>

          {selectedProjectId && (
            <>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3 h-10 rounded-lg bg-slate-800 text-white text-sm font-semibold"
              >
                Add Manual Entry
              </button>
              <button
                onClick={handleAutoCompute}
                className="px-3 h-10 rounded-lg bg-blue-600 text-white text-sm font-semibold"
              >
                Auto-Compute
              </button>
              <a
                href={`/financing-sources?projectId=${selectedProjectId}`}
                className="px-3 h-10 rounded-lg border border-slate-300 text-sm flex items-center"
              >
                Manage Financing
              </a>
              {forecasts.length > 0 && (
                <>
                  <button
                    onClick={exportToExcel}
                    className="px-3 h-10 rounded-lg bg-emerald-500 text-white text-sm font-semibold"
                  >
                    Export Excel
                  </button>
                  <button
                    onClick={exportToPDF}
                    className="px-3 h-10 rounded-lg bg-red-500 text-white text-sm font-semibold"
                  >
                    Export PDF
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {/* Add entry modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <h2 className="text-xl font-bold mb-4">Add Cashflow Entry</h2>
              <form onSubmit={handleAddEntry} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Week Start Date
                  </label>
                  <input
                    type="date"
                    name="weekStart"
                    value={formData.weekStart}
                    onChange={handleFormChange}
                    required
                    className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Inflows
                  </label>
                  <input
                    type="number"
                    name="inflows"
                    value={formData.inflows}
                    onChange={handleFormChange}
                    min={0}
                    step="0.01"
                    required
                    className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Outflows
                  </label>
                  <input
                    type="number"
                    name="outflows"
                    value={formData.outflows}
                    onChange={handleFormChange}
                    min={0}
                    step="0.01"
                    required
                    className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 h-9 rounded-lg border border-slate-300 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 h-9 rounded-lg bg-blue-600 text-white text-sm font-semibold"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Summary + Chart */}
        {summary && selectedProjectId && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            <div className="border border-slate-200 rounded-xl p-4 bg-white">
              <div className="text-xs text-slate-500">Total Inflows</div>
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(summary.totalInflows)}
              </div>
            </div>
            <div className="border border-slate-200 rounded-xl p-4 bg-white">
              <div className="text-xs text-slate-500">Total Outflows</div>
              <div className="text-2xl font-bold text-red-500">
                {formatCurrency(summary.totalOutflows)}
              </div>
            </div>
            <div className="border border-slate-200 rounded-xl p-4 bg-white">
              <div className="text-xs text-slate-500">Net Cashflow</div>
              <div
                className={`text-2xl font-bold ${
                  summary.netCashflow >= 0 ? 'text-emerald-600' : 'text-red-500'
                }`}
              >
                {formatCurrency(summary.netCashflow)}
              </div>
            </div>
            <div className="border border-slate-200 rounded-xl p-4 bg-white">
              <div className="text-xs text-slate-500">Current Balance</div>
              <div
                className={`text-2xl font-bold ${
                  summary.currentBalance >= 0
                    ? 'text-emerald-600'
                    : 'text-red-500'
                }`}
              >
                {formatCurrency(summary.currentBalance)}
              </div>
            </div>
          </div>
        )}

        {chartData.length > 0 && (
          <div className="mb-8 border border-slate-200 rounded-2xl bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">
              Weekly Cashflow Trend
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    stroke="#6366f1"
                    fill="#c7d2fe"
                    name="Cumulative"
                  />
                  <Line
                    type="monotone"
                    dataKey="net"
                    stroke="#22c55e"
                    dot={false}
                    name="Net"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Alerts */}
        {summary && summary.alerts.length > 0 && (
          <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50">
            <h3 className="font-semibold text-red-700 mb-2">
              Cashflow Alerts ({summary.alerts.length})
            </h3>
            <ul className="list-disc ml-5 text-sm text-red-700">
              {summary.alerts.map((alert, idx) => (
                <li key={idx}>
                  <strong>Week of {formatDate(alert.week)}:</strong>{' '}
                  {alert.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Table */}
        {selectedProjectId && (
          <>
            {loading ? (
              <p className="text-center text-slate-600 mt-6">Loading...</p>
            ) : forecasts.length === 0 ? (
              <div className="text-center p-10 bg-white/80 rounded-2xl border border-slate-200">
                <p className="text-base text-slate-700 mb-2">
                  No cashflow data yet.
                </p>
                <p className="text-sm text-slate-500">
                  Use Auto-Compute or add manual entries to build your forecast.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Week Starting</th>
                      <th className="px-4 py-2 text-right">Inflows</th>
                      <th className="px-4 py-2 text-right">Outflows</th>
                      <th className="px-4 py-2 text-right">Net</th>
                      <th className="px-4 py-2 text-right">
                        Cumulative Balance
                      </th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecasts.map((f) => {
                      const net = f.inflows - f.outflows;
                      const isNegative = f.cumulative < 0;
                      return (
                        <tr
                          key={f.id}
                          className={`border-t ${
                            isNegative ? 'bg-red-50' : ''
                          }`}
                        >
                          <td className="px-4 py-2">
                            {formatDate(f.weekStart)}
                          </td>
                          <td className="px-4 py-2 text-right text-emerald-600">
                            {formatCurrency(f.inflows)}
                          </td>
                          <td className="px-4 py-2 text-right text-red-500">
                            {formatCurrency(f.outflows)}
                          </td>
                          <td
                            className={`px-4 py-2 text-right ${
                              net >= 0 ? 'text-emerald-600' : 'text-red-500'
                            }`}
                          >
                            {formatCurrency(net)}
                          </td>
                          <td
                            className={`px-4 py-2 text-right font-semibold ${
                              f.cumulative >= 0
                                ? 'text-emerald-600'
                                : 'text-red-500'
                            }`}
                          >
                            {formatCurrency(f.cumulative)}
                          </td>
                          <td className="px-4 py-2">
                            {isNegative ? (
                              <span className="text-red-600 font-semibold">
                                Shortfall
                              </span>
                            ) : f.cumulative < 10000 ? (
                              <span className="text-amber-600">Low Balance</span>
                            ) : (
                              <span className="text-emerald-600">OK</span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <button
                              onClick={() => handleDelete(f.id)}
                              className="px-3 h-8 rounded-md border border-slate-300 text-xs hover:bg-slate-50"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 font-semibold">
                    <tr>
                      <td className="px-4 py-2">Total</td>
                      <td className="px-4 py-2 text-right text-emerald-600">
                        {formatCurrency(
                          forecasts.reduce((sum, f) => sum + f.inflows, 0)
                        )}
                      </td>
                      <td className="px-4 py-2 text-right text-red-500">
                        {formatCurrency(
                          forecasts.reduce((sum, f) => sum + f.outflows, 0)
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {formatCurrency(
                          forecasts.reduce(
                            (sum, f) => sum + (f.inflows - f.outflows),
                            0
                          )
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {forecasts.length > 0
                          ? formatCurrency(
                              forecasts[forecasts.length - 1]!.cumulative
                            )
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
    </div>
  );
}
