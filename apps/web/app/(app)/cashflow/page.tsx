// app/cashflow/page.tsx - Cashflow forecasting page

'use client';

import { useState } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Calendar, 
  AlertTriangle, Download, Plus, ArrowUpCircle, 
  ArrowDownCircle, RefreshCw 
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, ComposedChart 
} from 'recharts';

// Mock data
const cashflowForecast = [
  { week: 'Week 1', inflows: 150000, outflows: 120000, cumulative: 30000, forecast: 35000 },
  { week: 'Week 2', inflows: 200000, outflows: 180000, cumulative: 50000, forecast: 55000 },
  { week: 'Week 3', inflows: 180000, outflows: 220000, cumulative: 10000, forecast: 15000 },
  { week: 'Week 4', inflows: 250000, outflows: 190000, cumulative: 70000, forecast: 75000 },
  { week: 'Week 5', inflows: 300000, outflows: 250000, cumulative: 120000, forecast: 130000 },
  { week: 'Week 6', inflows: 220000, outflows: 280000, cumulative: 60000, forecast: 70000 },
  { week: 'Week 7', inflows: 280000, outflows: 210000, cumulative: 130000, forecast: 140000 },
  { week: 'Week 8', inflows: 320000, outflows: 270000, cumulative: 180000, forecast: 190000 },
];

const monthlyComparison = [
  { month: 'Jan', actual: 850000, projected: 900000 },
  { month: 'Feb', actual: 920000, projected: 950000 },
  { month: 'Mar', actual: 1100000, projected: 1000000 },
  { month: 'Apr', actual: 950000, projected: 980000 },
  { month: 'May', actual: 1050000, projected: 1100000 },
  { month: 'Jun', actual: 0, projected: 1200000 },
];

const financingSources = [
  { id: '1', type: 'Equity Investment', amount: 2000000, received: 2000000, rate: 0, status: 'Received', date: '2024-01-15' },
  { id: '2', type: 'Production Loan', amount: 1500000, received: 1200000, rate: 5.5, status: 'Partial', date: '2024-02-01' },
  { id: '3', type: 'Tax Incentive', amount: 800000, received: 0, rate: 0, status: 'Pending', date: '2024-06-01' },
  { id: '4', type: 'Grant', amount: 300000, received: 300000, rate: 0, status: 'Received', date: '2024-03-10' },
  { id: '5', type: 'Pre-Sales', amount: 600000, received: 200000, rate: 0, status: 'Partial', date: '2024-04-15' },
];

const upcomingPayments = [
  { id: '1', payee: 'Lead Actor', amount: 250000, dueDate: '2024-04-05', category: 'Cast', priority: 'High' },
  { id: '2', payee: 'VFX Studio', amount: 125000, dueDate: '2024-04-10', category: 'Post', priority: 'High' },
  { id: '3', payee: 'Camera Rental', amount: 45000, dueDate: '2024-04-12', category: 'Equipment', priority: 'Medium' },
  { id: '4', payee: 'Location Fees', amount: 35000, dueDate: '2024-04-15', category: 'Location', priority: 'Medium' },
  { id: '5', payee: 'Catering Service', amount: 8500, dueDate: '2024-04-18', category: 'Production', priority: 'Low' },
  { id: '6', payee: 'Sound Design', amount: 60000, dueDate: '2024-04-20', category: 'Post', priority: 'Medium' },
];

const burnRate = [
  { week: 'W1', rate: 120000 },
  { week: 'W2', rate: 180000 },
  { week: 'W3', rate: 220000 },
  { week: 'W4', rate: 190000 },
  { week: 'W5', rate: 250000 },
  { week: 'W6', rate: 280000 },
  { week: 'W7', rate: 210000 },
  { week: 'W8', rate: 270000 },
];

export default function CashflowPage() {
  const [timeRange, setTimeRange] = useState('8weeks');

  const totalInflows = cashflowForecast.reduce((sum, w) => sum + w.inflows, 0);
  const totalOutflows = cashflowForecast.reduce((sum, w) => sum + w.outflows, 0);
  const netCashflow = totalInflows - totalOutflows;
  const currentBalance = cashflowForecast[cashflowForecast.length - 1]?.cumulative ?? 0;
  
  const totalFinancing = financingSources.reduce((sum, s) => sum + s.amount, 0);
  const receivedFinancing = financingSources.reduce((sum, s) => sum + s.received, 0);
  const pendingFinancing = totalFinancing - receivedFinancing;

  const upcomingTotal = upcomingPayments.reduce((sum, p) => sum + p.amount, 0);
  const highPriorityTotal = upcomingPayments.filter(p => p.priority === 'High').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cashflow Management</h1>
          <p className="text-gray-600">Monitor cashflow, forecast future needs, and track financing</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="4weeks">4 Weeks</option>
            <option value="8weeks">8 Weeks</option>
            <option value="12weeks">12 Weeks</option>
            <option value="6months">6 Months</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-5 h-5" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-6 h-6 opacity-80" />
          </div>
          <p className="text-blue-100 text-sm mb-1">Current Balance</p>
          <p className="text-3xl font-bold">${currentBalance.toLocaleString()}</p>
          <p className="text-blue-100 text-xs mt-2">As of today</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <ArrowUpCircle className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm font-medium text-green-600">+{((totalInflows / totalOutflows - 1) * 100).toFixed(1)}%</span>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Inflows</p>
          <p className="text-2xl font-bold text-gray-900">${(totalInflows / 1000000).toFixed(2)}M</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <ArrowDownCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Outflows</p>
          <p className="text-2xl font-bold text-gray-900">${(totalOutflows / 1000000).toFixed(2)}M</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${netCashflow >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              {netCashflow >= 0 ? (
                <TrendingUp className="w-6 h-6 text-green-600" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-600" />
              )}
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Net Cashflow</p>
          <p className={`text-2xl font-bold ${netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {netCashflow >= 0 ? '+' : ''}${(netCashflow / 1000).toFixed(0)}K
          </p>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">Cashflow Forecast</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-600">Inflows</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-sm text-gray-600">Outflows</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600">Cumulative</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={cashflowForecast}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="week" tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
            <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
            <Bar dataKey="inflows" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            <Bar dataKey="outflows" fill="#ef4444" radius={[8, 8, 0, 0]} />
            <Line type="monotone" dataKey="cumulative" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="forecast" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Burn Rate */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Weekly Burn Rate</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={burnRate}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
              <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
              <Area type="monotone" dataKey="rate" stroke="#ef4444" fill="#fee2e2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Actual vs Projected */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Actual vs Projected</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
              <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="actual" fill="#10b981" radius={[8, 8, 0, 0]} name="Actual" />
              <Bar dataKey="projected" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Projected" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financing Sources */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Financing Sources</h3>
            <button className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
              <Plus className="w-4 h-4" />
              Add Source
            </button>
          </div>
          <div className="p-6">
            <div className="mb-4 grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600 font-medium mb-1">Total</p>
                <p className="text-lg font-bold text-blue-900">${(totalFinancing / 1000000).toFixed(1)}M</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-green-600 font-medium mb-1">Received</p>
                <p className="text-lg font-bold text-green-900">${(receivedFinancing / 1000000).toFixed(1)}M</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-xs text-orange-600 font-medium mb-1">Pending</p>
                <p className="text-lg font-bold text-orange-900">${(pendingFinancing / 1000000).toFixed(1)}M</p>
              </div>
            </div>
            <div className="space-y-3">
              {financingSources.map((source) => (
                <div key={source.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{source.type}</p>
                    <p className="text-xs text-gray-500 mt-1">Due: {source.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">${(source.amount / 1000).toFixed(0)}K</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                      source.status === 'Received' ? 'bg-green-100 text-green-700' :
                      source.status === 'Partial' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {source.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Payments */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Upcoming Payments</h3>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-orange-600 font-medium">
                ${(highPriorityTotal / 1000).toFixed(0)}K urgent
              </span>
            </div>
          </div>
          <div className="p-6">
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm font-semibold text-orange-900 mb-1">Total Due (Next 30 Days)</p>
              <p className="text-2xl font-bold text-orange-600">${upcomingTotal.toLocaleString()}</p>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {upcomingPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-900">{payment.payee}</p>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        payment.priority === 'High' ? 'bg-red-100 text-red-700' :
                        payment.priority === 'Medium' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {payment.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {payment.dueDate}
                      </span>
                      <span>{payment.category}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">${(payment.amount / 1000).toFixed(0)}K</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}