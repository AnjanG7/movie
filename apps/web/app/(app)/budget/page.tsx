// app/budget/page.tsx - Budget management page

'use client';

import { useState } from 'react';
import { 
  DollarSign, Plus, Filter, Download, TrendingUp, 
  TrendingDown, AlertCircle, Search, Edit, Trash2, Eye 
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Mock data
const budgetVersions = [
  { id: '1', version: 'v1.0', type: 'BASELINE', createdAt: '2024-01-15', total: 2500000, spent: 1800000, status: 'Active' },
  { id: '2', version: 'v1.1', type: 'WORKING', createdAt: '2024-02-20', total: 2700000, spent: 1950000, status: 'Active' },
  { id: '3', version: 'v2.0', type: 'QUOTE', createdAt: '2024-03-10', total: 2900000, spent: 0, status: 'Draft' },
];

const budgetLines = [
  { id: '1', phase: 'DEVELOPMENT', department: 'Script', name: 'Script Development', qty: 1, rate: 50000, spent: 45000, vendor: 'Writers Guild' },
  { id: '2', phase: 'DEVELOPMENT', department: 'Pre-Production', name: 'Location Scouting', qty: 10, rate: 5000, spent: 48000, vendor: 'Location Services' },
  { id: '3', phase: 'PRODUCTION', department: 'Camera', name: 'Camera Equipment', qty: 30, rate: 3000, spent: 85000, vendor: 'Panavision' },
  { id: '4', phase: 'PRODUCTION', department: 'Cast', name: 'Lead Actor', qty: 1, rate: 500000, spent: 500000, vendor: 'Talent Agency' },
  { id: '5', phase: 'PRODUCTION', department: 'Crew', name: 'Director of Photography', qty: 30, rate: 5000, spent: 145000, vendor: 'DOP Services' },
  { id: '6', phase: 'POST', department: 'Editing', name: 'Post Production', qty: 1, rate: 200000, spent: 120000, vendor: 'Edit House' },
  { id: '7', phase: 'POST', department: 'VFX', name: 'Visual Effects', qty: 1, rate: 350000, spent: 280000, vendor: 'VFX Studio' },
  { id: '8', phase: 'PUBLICITY', department: 'Marketing', name: 'Marketing Campaign', qty: 1, rate: 400000, spent: 150000, vendor: 'Marketing Agency' },
];

const budgetTrend = [
  { month: 'Jan', allocated: 2500000, spent: 800000, forecast: 850000 },
  { month: 'Feb', allocated: 2500000, spent: 1200000, forecast: 1300000 },
  { month: 'Mar', allocated: 2700000, spent: 1800000, forecast: 1900000 },
  { month: 'Apr', allocated: 2700000, spent: 2100000, forecast: 2200000 },
  { month: 'May', allocated: 2900000, spent: 2400000, forecast: 2600000 },
];

const phaseBreakdown = [
  { phase: 'Development', budget: 450000, spent: 420000 },
  { phase: 'Production', budget: 1500000, spent: 1200000 },
  { phase: 'Post', budget: 650000, spent: 480000 },
  { phase: 'Publicity', budget: 400000, spent: 150000 },
];

export default function BudgetPage() {
  const [selectedVersion, setSelectedVersion] = useState('v1.1');
  const [filterPhase, setFilterPhase] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const currentVersion = budgetVersions.find(v => v.version === selectedVersion);
  const utilizationRate = currentVersion ? (currentVersion.spent / currentVersion.total) * 100 : 0;

  const filteredLines = budgetLines.filter(line => {
    const matchesPhase = filterPhase === 'all' || line.phase === filterPhase;
    const matchesSearch = line.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         line.department.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesPhase && matchesSearch;
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Budget Management</h1>
          <p className="text-gray-600">Track and manage project budgets across all phases</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-5 h-5" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-5 h-5" />
            New Budget Version
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
              {utilizationRate.toFixed(0)}%
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Budget</p>
          <p className="text-2xl font-bold text-gray-900">
            ${(currentVersion?.total || 0).toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Spent</p>
          <p className="text-2xl font-bold text-gray-900">
            ${(currentVersion?.spent || 0).toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingDown className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Remaining</p>
          <p className="text-2xl font-bold text-gray-900">
            ${((currentVersion?.total || 0) - (currentVersion?.spent || 0)).toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Budget Versions</p>
          <p className="text-2xl font-bold text-gray-900">{budgetVersions.length}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Budget Trend */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Budget Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={budgetTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="allocated" stroke="#3b82f6" strokeWidth={2} name="Allocated" />
              <Line type="monotone" dataKey="spent" stroke="#10b981" strokeWidth={2} name="Spent" />
              <Line type="monotone" dataKey="forecast" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" name="Forecast" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Phase Breakdown */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Budget by Phase</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={phaseBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="phase" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="budget" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Budget" />
              <Bar dataKey="spent" fill="#10b981" radius={[8, 8, 0, 0]} name="Spent" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Budget Lines Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Budget Line Items</h3>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            {/* Phase Filter */}
            <select
              value={filterPhase}
              onChange={(e) => setFilterPhase(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Phases</option>
              <option value="DEVELOPMENT">Development</option>
              <option value="PRODUCTION">Production</option>
              <option value="POST">Post</option>
              <option value="PUBLICITY">Publicity</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Phase</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Department</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Item</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Qty</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Rate</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Budget</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Spent</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLines.map((line) => {
                const budget = line.qty * line.rate;
                const percentSpent = (line.spent / budget) * 100;
                const isOverBudget = line.spent > budget;

                return (
                  <tr key={line.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        line.phase === 'DEVELOPMENT' ? 'bg-blue-100 text-blue-700' :
                        line.phase === 'PRODUCTION' ? 'bg-green-100 text-green-700' :
                        line.phase === 'POST' ? 'bg-orange-100 text-orange-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {line.phase}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{line.department}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{line.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{line.qty}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${line.rate.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ${budget.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      ${line.spent.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 w-20">
                          <div
                            className={`h-2 rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(percentSpent, 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${isOverBudget ? 'text-red-600' : 'text-gray-600'}`}>
                          {percentSpent.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                          <Edit className="w-4 h-4 text-gray-600" />
                        </button>
                        <button className="p-1 hover:bg-red-50 rounded transition-colors">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}