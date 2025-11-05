// app/vendors/page.tsx - Vendor management page

'use client';

import { useState } from 'react';
import { 
  Users, Plus, Search, Filter, DollarSign, FileText, 
  CheckCircle, Clock, XCircle, Eye, Edit, Trash2, 
  TrendingUp, AlertTriangle, Download, Mail, Phone 
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

// Mock data
const vendors = [
  { 
    id: '1', 
    name: 'Panavision', 
    currency: 'USD', 
    totalPOs: 12, 
    totalAmount: 450000, 
    paid: 380000, 
    pending: 70000,
    status: 'Active',
    category: 'Equipment',
    email: 'contact@panavision.com',
    phone: '+1 (555) 123-4567',
    invoices: 15,
    lastPayment: '2024-03-15'
  },
  { 
    id: '2', 
    name: 'Location Services Inc', 
    currency: 'USD', 
    totalPOs: 8, 
    totalAmount: 280000, 
    paid: 280000, 
    pending: 0,
    status: 'Active',
    category: 'Location',
    email: 'info@locationservices.com',
    phone: '+1 (555) 234-5678',
    invoices: 10,
    lastPayment: '2024-03-20'
  },
  { 
    id: '3', 
    name: 'VFX Studio Pro', 
    currency: 'USD', 
    totalPOs: 5, 
    totalAmount: 850000, 
    paid: 550000, 
    pending: 300000,
    status: 'Active',
    category: 'Post Production',
    email: 'hello@vfxstudiopro.com',
    phone: '+1 (555) 345-6789',
    invoices: 8,
    lastPayment: '2024-03-10'
  },
  { 
    id: '4', 
    name: 'Catering Masters', 
    currency: 'USD', 
    totalPOs: 30, 
    totalAmount: 120000, 
    paid: 95000, 
    pending: 25000,
    status: 'Active',
    category: 'Catering',
    email: 'orders@cateringmasters.com',
    phone: '+1 (555) 456-7890',
    invoices: 32,
    lastPayment: '2024-03-18'
  },
  { 
    id: '5', 
    name: 'Talent Agency Elite', 
    currency: 'USD', 
    totalPOs: 3, 
    totalAmount: 1200000, 
    paid: 800000, 
    pending: 400000,
    status: 'Active',
    category: 'Talent',
    email: 'casting@talentagency.com',
    phone: '+1 (555) 567-8901',
    invoices: 5,
    lastPayment: '2024-03-01'
  },
  { 
    id: '6', 
    name: 'Sound & Music Co', 
    currency: 'USD', 
    totalPOs: 6, 
    totalAmount: 180000, 
    paid: 120000, 
    pending: 60000,
    status: 'Inactive',
    category: 'Sound',
    email: 'info@soundmusic.com',
    phone: '+1 (555) 678-9012',
    invoices: 7,
    lastPayment: '2024-02-28'
  },
];

const purchaseOrders = [
  { id: 'PO-2024-001', vendor: 'Panavision', amount: 45000, status: 'Approved', date: '2024-03-15', approvedBy: 'John Doe' },
  { id: 'PO-2024-002', vendor: 'VFX Studio Pro', amount: 125000, status: 'Pending', date: '2024-03-18', approvedBy: null },
  { id: 'PO-2024-003', vendor: 'Catering Masters', amount: 8500, status: 'Approved', date: '2024-03-20', approvedBy: 'Jane Smith' },
  { id: 'PO-2024-004', vendor: 'Talent Agency Elite', amount: 250000, status: 'Rejected', date: '2024-03-12', approvedBy: 'Admin' },
  { id: 'PO-2024-005', vendor: 'Location Services Inc', amount: 35000, status: 'Approved', date: '2024-03-22', approvedBy: 'John Doe' },
];

const categorySpending = [
  { name: 'Talent', value: 1200000, color: '#3b82f6' },
  { name: 'Post Production', value: 850000, color: '#10b981' },
  { name: 'Equipment', value: 450000, color: '#f59e0b' },
  { name: 'Location', value: 280000, color: '#8b5cf6' },
  { name: 'Sound', value: 180000, color: '#ec4899' },
  { name: 'Catering', value: 120000, color: '#14b8a6' },
];

const monthlySpending = [
  { month: 'Jan', spending: 320000 },
  { month: 'Feb', spending: 580000 },
  { month: 'Mar', spending: 720000 },
  { month: 'Apr', spending: 450000 },
  { month: 'May', spending: 610000 },
];

export default function VendorsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState<'vendors' | 'pos'>('vendors');

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || vendor.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || vendor.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalVendors = vendors.length;
  const activeVendors = vendors.filter(v => v.status === 'Active').length;
  const totalSpending = vendors.reduce((sum, v) => sum + v.totalAmount, 0);
  const totalPending = vendors.reduce((sum, v) => sum + v.pending, 0);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vendor Management</h1>
          <p className="text-gray-600">Manage vendors, purchase orders, and payments</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-5 h-5" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-5 h-5" />
            Add Vendor
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Vendors</p>
          <p className="text-2xl font-bold text-gray-900">{totalVendors}</p>
          <p className="text-xs text-green-600 mt-2">{activeVendors} Active</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Spending</p>
          <p className="text-2xl font-bold text-gray-900">${(totalSpending / 1000000).toFixed(1)}M</p>
          <p className="text-xs text-gray-500 mt-2">Across all vendors</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Pending Payments</p>
          <p className="text-2xl font-bold text-gray-900">${(totalPending / 1000).toFixed(0)}K</p>
          <p className="text-xs text-orange-600 mt-2">Requires attention</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Purchase Orders</p>
          <p className="text-2xl font-bold text-gray-900">{vendors.reduce((sum, v) => sum + v.totalPOs, 0)}</p>
          <p className="text-xs text-gray-500 mt-2">Total issued</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Category Spending */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Spending by Category</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={categorySpending}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {categorySpending.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value) => <span className="text-sm">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Spending */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Monthly Spending Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlySpending}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
              <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
              <Bar dataKey="spending" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('vendors')}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              activeTab === 'vendors'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Vendors ({vendors.length})
          </button>
          <button
            onClick={() => setActiveTab('pos')}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              activeTab === 'pos'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Purchase Orders ({purchaseOrders.length})
          </button>
        </div>

        {/* Filters */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-64"
              />
            </div>
            {activeTab === 'vendors' && (
              <>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">All Categories</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Talent">Talent</option>
                  <option value="Post Production">Post Production</option>
                  <option value="Location">Location</option>
                  <option value="Catering">Catering</option>
                  <option value="Sound">Sound</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        {activeTab === 'vendors' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Vendor</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">POs</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Total Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Paid</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Pending</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {vendor.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{vendor.name}</p>
                          <p className="text-xs text-gray-500">{vendor.currency}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {vendor.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Mail className="w-3 h-3" />
                          <span className="truncate max-w-40">{vendor.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Phone className="w-3 h-3" />
                          <span>{vendor.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vendor.totalPOs}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ${vendor.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      ${vendor.paid.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-orange-600">
                      ${vendor.pending.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        vendor.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {vendor.status}
                      </span>
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
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">PO Number</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Vendor</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Approved By</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{po.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{po.vendor}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ${po.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{po.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{po.approvedBy || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                        po.status === 'Approved' ? 'bg-green-100 text-green-700' :
                        po.status === 'Pending' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {po.status === 'Approved' && <CheckCircle className="w-3 h-3" />}
                        {po.status === 'Pending' && <Clock className="w-3 h-3" />}
                        {po.status === 'Rejected' && <XCircle className="w-3 h-3" />}
                        {po.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                          <Download className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}