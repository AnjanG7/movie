'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  getPublicityBudgets,
  createPublicityBudget,
  updatePublicityBudget,
  deletePublicityBudget,
  addPublicityExpense,
  deletePublicityExpense,
  getCampaignCalendar,
  createCampaignEvent,
  updateCampaignEvent,
  deleteCampaignEvent,
  getPublicitySummary,
  updateROIWithPublicity
} from '../../../lib/api/publicity';
import type {
  PublicityBudget,
  PublicityExpense,
  CampaignEvent,
  PublicitySummary,
  PublicityCategory,
  PublicityStatus,
  CampaignEventType,
  CampaignStatus
} from '../../../lib/types/publicity';
import {
  Megaphone,
  DollarSign,
  Calendar,
  TrendingUp,
  Plus,
  X,
  Edit2,
  Trash2,
  Film,
  BarChart3
} from 'lucide-react';

export default function PublicityPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [activeTab, setActiveTab] = useState<'budget' | 'calendar' | 'summary'>('budget');
  const [budgets, setBudgets] = useState<PublicityBudget[]>([]);
  const [campaignEvents, setCampaignEvents] = useState<CampaignEvent[]>([]);
  const [summary, setSummary] = useState<PublicitySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<PublicityBudget | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<CampaignEvent | null>(null);
  const [selectedBudgetForExpense, setSelectedBudgetForExpense] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states with proper types
  const [budgetFormData, setBudgetFormData] = useState<{
    name: string;
    category: PublicityCategory;
    description: string;
    budgetAmount: string;
    vendor: string;
    startDate: string;
    endDate: string;
    status: PublicityStatus;
    notes: string;
  }>({
    name: '',
    category: 'TRAILER',
    description: '',
    budgetAmount: '',
    vendor: '',
    startDate: '',
    endDate: '',
    status: 'PLANNED',
    notes: ''
  });

  const [expenseFormData, setExpenseFormData] = useState<{
    description: string;
    amount: string;
    expenseDate: string;
    vendor: string;
    invoiceNumber: string;
    notes: string;
  }>({
    description: '',
    amount: '',
    expenseDate: '',
    vendor: '',
    invoiceNumber: '',
    notes: ''
  });

  const [campaignFormData, setCampaignFormData] = useState<{
    title: string;
    description: string;
    eventType: CampaignEventType;
    startDate: string;
    endDate: string;
    deliverable: string;
    publicityBudgetId: string;
    status: CampaignStatus;
    notes: string;
  }>({
    title: '',
    description: '',
    eventType: 'TRAILER_RELEASE',
    startDate: '',
    endDate: '',
    deliverable: '',
    publicityBudgetId: '',
    status: 'UPCOMING',
    notes: ''
  });

  useEffect(() => {
    if (projectId) {
      fetchAllData();
    }
  }, [projectId]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [budgetsRes, calendarRes, summaryRes] = await Promise.all([
        getPublicityBudgets(projectId),
        getCampaignCalendar(projectId),
        getPublicitySummary(projectId)
      ]);

      if (budgetsRes.success) {
        setBudgets(budgetsRes.data.budgets || []);
      }

      if (calendarRes.success) {
        setCampaignEvents(calendarRes.data || []);
      }

      if (summaryRes.success) {
        setSummary(summaryRes.data);
      }
    } catch (err: unknown) {
      console.error('Error fetching publicity data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ==================== HELPER FUNCTIONS ====================

// Helper function - replace the existing one
// Alternative version with better type narrowing
const formatDateForInput = (dateString?: string | null): string => {
  return dateString?.split('T')[0] ?? '';
};



  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryLabel = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNED':
      case 'UPCOMING':
        return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // ==================== BUDGET FUNCTIONS ====================

  const handleBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = {
        ...budgetFormData,
        budgetAmount: parseFloat(budgetFormData.budgetAmount)
      };

      let response;
      if (editingBudget) {
        response = await updatePublicityBudget(projectId, editingBudget.id, data);
      } else {
        response = await createPublicityBudget(projectId, data);
      }

      if (response.success) {
        alert(editingBudget ? 'Budget updated successfully!' : 'Budget created successfully!');
        closeBudgetModal();
        fetchAllData();
      } else {
        throw new Error(response.message || 'Failed to save budget');
      }
    } catch (err: unknown) {
      console.error('Error saving budget:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save budget';
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!confirm('Are you sure you want to delete this budget item?')) return;

    try {
      const response = await deletePublicityBudget(projectId, id);
      if (response.success) {
        alert('Budget deleted successfully!');
        fetchAllData();
      }
    } catch (err: unknown) {
      console.error('Error deleting budget:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete budget';
      alert(errorMessage);
    }
  };

  const openBudgetModal = (budget: PublicityBudget | null = null) => {
    if (budget) {
      setEditingBudget(budget);
      setBudgetFormData({
        name: budget.name,
        category: budget.category,
        description: budget.description || '',
        budgetAmount: budget.budgetAmount.toString(),
        vendor: budget.vendor || '',
        startDate: formatDateForInput(budget.startDate),
        endDate: formatDateForInput(budget.endDate),
        status: budget.status,
        notes: budget.notes || ''
      });
    } else {
      setEditingBudget(null);
      setBudgetFormData({
        name: '',
        category: 'TRAILER',
        description: '',
        budgetAmount: '',
        vendor: '',
        startDate: '',
        endDate: '',
        status: 'PLANNED',
        notes: ''
      });
    }
    setShowBudgetModal(true);
  };

  const closeBudgetModal = () => {
    setShowBudgetModal(false);
    setEditingBudget(null);
  };

  // ==================== EXPENSE FUNCTIONS ====================

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBudgetForExpense) return;

    setSubmitting(true);

    try {
      const data = {
        ...expenseFormData,
        amount: parseFloat(expenseFormData.amount)
      };

      const response = await addPublicityExpense(projectId, selectedBudgetForExpense, data);

      if (response.success) {
        alert('Expense added successfully!');
        closeExpenseModal();
        fetchAllData();
      } else {
        throw new Error(response.message || 'Failed to add expense');
      }
    } catch (err: unknown) {
      console.error('Error adding expense:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add expense';
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      const response = await deletePublicityExpense(projectId, id);
      if (response.success) {
        alert('Expense deleted successfully!');
        fetchAllData();
      }
    } catch (err: unknown) {
      console.error('Error deleting expense:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete expense';
      alert(errorMessage);
    }
  };

  const openExpenseModal = (budgetId: string) => {
    setSelectedBudgetForExpense(budgetId);
    setExpenseFormData({
      description: '',
      amount: '',
      expenseDate: new Date().toISOString().split('T')[0] as string,
      vendor: '',
      invoiceNumber: '',
      notes: ''
    });
    setShowExpenseModal(true);
  };

  const closeExpenseModal = () => {
    setShowExpenseModal(false);
    setSelectedBudgetForExpense(null);
  };

  // ==================== CAMPAIGN FUNCTIONS ====================

  const handleCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = {
        ...campaignFormData,
        publicityBudgetId: campaignFormData.publicityBudgetId || null
      };

      let response;
      if (editingCampaign) {
        response = await updateCampaignEvent(projectId, editingCampaign.id, data);
      } else {
        response = await createCampaignEvent(projectId, data);
      }

      if (response.success) {
        alert(editingCampaign ? 'Event updated successfully!' : 'Event created successfully!');
        closeCampaignModal();
        fetchAllData();
      } else {
        throw new Error(response.message || 'Failed to save event');
      }
    } catch (err: unknown) {
      console.error('Error saving event:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save event';
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const response = await deleteCampaignEvent(projectId, id);
      if (response.success) {
        alert('Event deleted successfully!');
        fetchAllData();
      }
    } catch (err: unknown) {
      console.error('Error deleting event:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete event';
      alert(errorMessage);
    }
  };

  const openCampaignModal = (event: CampaignEvent | null = null) => {
    if (event) {
      setEditingCampaign(event);
      setCampaignFormData({
        title: event.title,
        description: event.description || '',
        eventType: event.eventType,
        startDate: formatDateForInput(event.startDate),
        endDate: formatDateForInput(event.endDate),
        deliverable: event.deliverable || '',
        publicityBudgetId: event.publicityBudgetId || '',
        status: event.status,
        notes: event.notes || ''
      });
    } else {
      setEditingCampaign(null);
      setCampaignFormData({
        title: '',
        description: '',
        eventType: 'TRAILER_RELEASE',
        startDate: '',
        endDate: '',
        deliverable: '',
        publicityBudgetId: '',
        status: 'UPCOMING',
        notes: ''
      });
    }
    setShowCampaignModal(true);
  };

  const closeCampaignModal = () => {
    setShowCampaignModal(false);
    setEditingCampaign(null);
  };

  // ==================== ROI UPDATE ====================

  const handleUpdateROI = async () => {
    try {
      setSubmitting(true);
      const response = await updateROIWithPublicity(projectId);
      if (response.success) {
        alert('ROI updated successfully with P&A costs!');
        console.log('Updated metrics:', response.data);
      } else {
        throw new Error(response.message || 'Failed to update ROI');
      }
    } catch (err: unknown) {
      console.error('Error updating ROI:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update ROI';
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // ==================== RENDER ====================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchAllData}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-pink-100 rounded-lg">
                <Megaphone className="w-8 h-8 text-pink-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                Publicity & P&A
              </h1>
            </div>
            <p className="text-gray-600">
              Manage marketing budget, campaign calendar, and track expenses
            </p>
          </div>
          <button
            onClick={handleUpdateROI}
            disabled={submitting}
            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <TrendingUp className="w-5 h-5" />
            {submitting ? 'Updating...' : 'Update ROI'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600">Total Budget</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(summary.summary.totalBudget)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">Total Spent</p>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(summary.summary.totalActual)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {summary.summary.percentSpent.toFixed(1)}% of budget
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-sm text-gray-600">Variance</p>
            </div>
            <p className={`text-2xl font-bold ${summary.summary.totalVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summary.summary.totalVariance)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-sm text-gray-600">Upcoming Events</p>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {summary.summary.upcomingEvents}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {summary.summary.totalEvents} total events
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {[
              { key: 'budget' as const, label: `Budget (${budgets.length})`, icon: DollarSign },
              { key: 'calendar' as const, label: `Campaign Calendar (${campaignEvents.length})`, icon: Calendar },
              { key: 'summary' as const, label: 'Summary', icon: BarChart3 }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === tab.key
                    ? 'border-pink-600 text-pink-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* BUDGET TAB */}
          {activeTab === 'budget' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">P&A Budget Items</h3>
                <button
                  onClick={() => openBudgetModal()}
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Budget Item
                </button>
              </div>

              {budgets.length === 0 ? (
                <div className="text-center py-12">
                  <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No P&A budget items yet</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Start by adding marketing and publicity budget items
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {budgets.map((budget) => (
                    <div
                      key={budget.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {budget.name}
                            </h4>
                            <span className={`text-xs px-2 py-1 rounded font-medium ${getStatusColor(budget.status)}`}>
                              {budget.status}
                            </span>
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                              {getCategoryLabel(budget.category)}
                            </span>
                          </div>
                          {budget.description && (
                            <p className="text-sm text-gray-600 mb-2">{budget.description}</p>
                          )}
                          <div className="flex gap-6 text-sm">
                            <div>
                              <p className="text-gray-500">Budget</p>
                              <p className="font-semibold text-gray-900">
                                {formatCurrency(budget.budgetAmount)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Spent</p>
                              <p className="font-semibold text-blue-600">
                                {formatCurrency(budget.actualAmount)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Remaining</p>
                              <p className={`font-semibold ${budget.budgetAmount - budget.actualAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(budget.budgetAmount - budget.actualAmount)}
                              </p>
                            </div>
                            {budget.vendor && (
                              <div>
                                <p className="text-gray-500">Vendor</p>
                                <p className="font-semibold text-gray-900">{budget.vendor}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openExpenseModal(budget.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Add Expense"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => openBudgetModal(budget)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBudget(budget.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Budget Utilization</span>
                          <span>
                            {budget.budgetAmount > 0
                              ? ((budget.actualAmount / budget.budgetAmount) * 100).toFixed(1)
                              : 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              budget.actualAmount > budget.budgetAmount
                                ? 'bg-red-600'
                                : budget.actualAmount / budget.budgetAmount > 0.9
                                ? 'bg-yellow-600'
                                : 'bg-green-600'
                            }`}
                            style={{
                              width: `${Math.min((budget.actualAmount / budget.budgetAmount) * 100, 100)}%`
                            }}
                          />
                        </div>
                      </div>

                      {/* Expenses List */}
                      {budget.expenses && budget.expenses.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Recent Expenses ({budget.expenses.length})
                          </p>
                          <div className="space-y-2">
                            {budget.expenses.slice(0, 3).map((expense) => (
                              <div
                                key={expense.id}
                                className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded"
                              >
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{expense.description}</p>
                                  <p className="text-xs text-gray-500">
                                    {formatDate(expense.expenseDate)}
                                    {expense.vendor && ` • ${expense.vendor}`}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-gray-900">
                                    {formatCurrency(expense.amount)}
                                  </p>
                                  <button
                                    onClick={() => handleDeleteExpense(expense.id)}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CAMPAIGN CALENDAR TAB */}
          {activeTab === 'calendar' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Campaign Calendar</h3>
                <button
                  onClick={() => openCampaignModal()}
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Event
                </button>
              </div>

              {campaignEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No campaign events scheduled</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Plan your marketing timeline and key milestones
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {campaignEvents
                    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                    .map((event) => (
                      <div
                        key={event.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Film className="w-5 h-5 text-pink-600" />
                              <h4 className="text-lg font-semibold text-gray-900">{event.title}</h4>
                              <span className={`text-xs px-2 py-1 rounded font-medium ${getStatusColor(event.status)}`}>
                                {event.status}
                              </span>
                            </div>
                            {event.description && (
                              <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                            )}
                            <div className="flex gap-6 text-sm">
                              <div>
                                <p className="text-gray-500">Type</p>
                                <p className="font-medium text-gray-900">
                                  {getCategoryLabel(event.eventType)}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Date</p>
                                <p className="font-medium text-gray-900">
                                  {formatDate(event.startDate)}
                                  {event.endDate && ` - ${formatDate(event.endDate)}`}
                                </p>
                              </div>
                              {event.publicityBudget && (
                                <div>
                                  <p className="text-gray-500">Linked Budget</p>
                                  <p className="font-medium text-gray-900">
                                    {event.publicityBudget.name}
                                  </p>
                                </div>
                              )}
                              {event.deliverable && (
                                <div>
                                  <p className="text-gray-500">Deliverable</p>
                                  <p className="font-medium text-gray-900">{event.deliverable}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openCampaignModal(event)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCampaign(event.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* SUMMARY TAB */}
          {activeTab === 'summary' && summary && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Financial Summary</h3>

              {/* By Category */}
              {summary.byCategory.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Spend by Category</h4>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Budgeted</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actual</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Variance</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Items</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {summary.byCategory.map((cat) => (
                          <tr key={cat.category}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {getCategoryLabel(cat.category)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-900">
                              {formatCurrency(cat.budgeted)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-blue-600 font-medium">
                              {formatCurrency(cat.actual)}
                            </td>
                            <td className={`px-4 py-3 text-sm text-right font-medium ${cat.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(cat.variance)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-600">
                              {cat.count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Recent Expenses */}
              {summary.recentExpenses.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Recent Expenses</h4>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {summary.recentExpenses.map((expense) => (
                          <tr key={expense.id}>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {formatDate(expense.expenseDate)}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {expense.description}
                              {expense.vendor && (
                                <span className="text-gray-500 text-xs ml-2">• {expense.vendor}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {expense.publicityBudget ? getCategoryLabel(expense.publicityBudget.category) : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                              {formatCurrency(expense.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ADD/EDIT BUDGET MODAL */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingBudget ? 'Edit Budget Item' : 'Add Budget Item'}
                </h2>
                <button
                  onClick={closeBudgetModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleBudgetSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={budgetFormData.name}
                    onChange={(e) => setBudgetFormData({ ...budgetFormData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="e.g., Theatrical Trailer Production"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={budgetFormData.category}
                    onChange={(e) => setBudgetFormData({ ...budgetFormData, category: e.target.value as PublicityCategory })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="TRAILER">Trailer</option>
                    <option value="KEY_ART">Key Art</option>
                    <option value="POSTER">Poster</option>
                    <option value="DIGITAL_MARKETING">Digital Marketing</option>
                    <option value="SOCIAL_MEDIA">Social Media</option>
                    <option value="PR">PR</option>
                    <option value="FESTIVALS">Festivals</option>
                    <option value="SCREENINGS">Screenings</option>
                    <option value="PRINT_ADS">Print Ads</option>
                    <option value="OOH">OOH (Out of Home)</option>
                    <option value="TV_SPOTS">TV Spots</option>
                    <option value="RADIO">Radio</option>
                    <option value="PRESS_KIT">Press Kit</option>
                    <option value="PREMIERE">Premiere</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {/* Budget Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Budget Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={budgetFormData.budgetAmount}
                    onChange={(e) => setBudgetFormData({ ...budgetFormData, budgetAmount: e.target.value })}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={budgetFormData.status}
                    onChange={(e) => setBudgetFormData({ ...budgetFormData, status: e.target.value as PublicityStatus })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="PLANNED">Planned</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                {/* Vendor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor
                  </label>
                  <input
                    type="text"
                    value={budgetFormData.vendor}
                    onChange={(e) => setBudgetFormData({ ...budgetFormData, vendor: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Vendor name"
                  />
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={budgetFormData.startDate}
                    onChange={(e) => setBudgetFormData({ ...budgetFormData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={budgetFormData.endDate}
                    onChange={(e) => setBudgetFormData({ ...budgetFormData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={budgetFormData.description}
                    onChange={(e) => setBudgetFormData({ ...budgetFormData, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Brief description..."
                  />
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={budgetFormData.notes}
                    onChange={(e) => setBudgetFormData({ ...budgetFormData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeBudgetModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : editingBudget ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD EXPENSE MODAL */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Add Expense</h2>
                <button
                  onClick={closeExpenseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleExpenseSubmit} className="p-6">
              <div className="space-y-4">
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={expenseFormData.description}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, description: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="e.g., Trailer production payment"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={expenseFormData.amount}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: e.target.value })}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                {/* Expense Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expense Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={expenseFormData.expenseDate}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, expenseDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                {/* Vendor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor
                  </label>
                  <input
                    type="text"
                    value={expenseFormData.vendor}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, vendor: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Vendor name"
                  />
                </div>

                {/* Invoice Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    value={expenseFormData.invoiceNumber}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="INV-001"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={expenseFormData.notes}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={closeExpenseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? 'Adding...' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD/EDIT CAMPAIGN EVENT MODAL */}
      {showCampaignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingCampaign ? 'Edit Campaign Event' : 'Add Campaign Event'}
                </h2>
                <button
                  onClick={closeCampaignModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCampaignSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={campaignFormData.title}
                    onChange={(e) => setCampaignFormData({ ...campaignFormData, title: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="e.g., Official Trailer Release"
                  />
                </div>

                {/* Event Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={campaignFormData.eventType}
                    onChange={(e) => setCampaignFormData({ ...campaignFormData, eventType: e.target.value as CampaignEventType })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="TEASER_RELEASE">Teaser Release</option>
                    <option value="TRAILER_RELEASE">Trailer Release</option>
                    <option value="POSTER_REVEAL">Poster Reveal</option>
                    <option value="FESTIVAL_SUBMISSION">Festival Submission</option>
                    <option value="FESTIVAL_SCREENING">Festival Screening</option>
                    <option value="PREMIERE">Premiere</option>
                    <option value="THEATRICAL_RELEASE">Theatrical Release</option>
                    <option value="STREAMING_RELEASE">Streaming Release</option>
                    <option value="PRESS_CONFERENCE">Press Conference</option>
                    <option value="SOCIAL_MEDIA_CAMPAIGN">Social Media Campaign</option>
                    <option value="TV_APPEARANCE">TV Appearance</option>
                    <option value="PRESS_JUNKET">Press Junket</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={campaignFormData.status}
                    onChange={(e) => setCampaignFormData({ ...campaignFormData, status: e.target.value as CampaignStatus })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="UPCOMING">Upcoming</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={campaignFormData.startDate}
                    onChange={(e) => setCampaignFormData({ ...campaignFormData, startDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={campaignFormData.endDate}
                    onChange={(e) => setCampaignFormData({ ...campaignFormData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                {/* Link to Budget */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link to Budget Item (Optional)
                  </label>
                  <select
                    value={campaignFormData.publicityBudgetId}
                    onChange={(e) => setCampaignFormData({ ...campaignFormData, publicityBudgetId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="">-- None --</option>
                    {budgets.map((budget) => (
                      <option key={budget.id} value={budget.id}>
                        {budget.name} ({getCategoryLabel(budget.category)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Deliverable */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deliverable
                  </label>
                  <input
                    type="text"
                    value={campaignFormData.deliverable}
                    onChange={(e) => setCampaignFormData({ ...campaignFormData, deliverable: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="e.g., 2-minute trailer, 30-second TV spot"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={campaignFormData.description}
                    onChange={(e) => setCampaignFormData({ ...campaignFormData, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Event details..."
                  />
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={campaignFormData.notes}
                    onChange={(e) => setCampaignFormData({ ...campaignFormData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeCampaignModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : editingCampaign ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
