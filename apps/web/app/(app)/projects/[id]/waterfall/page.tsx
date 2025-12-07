'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  TrendingUp,
  Users,
  DollarSign,
  Plus,
  X,
  ArrowLeft,
  Calculator,
  Layers,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  createWaterfall,
  addTiers,
  addParticipants,
  addRevenuePeriod,
  calculateDistribution,
  getWaterfall,
  WaterfallDefinition,
  WaterfallTier,
  WaterfallParticipant,
  WaterfallPeriod,
  WaterfallPayout,
} from '../../../lib/api/waterfall';

export default function WaterfallPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  // State
  const [waterfall, setWaterfall] = useState<WaterfallDefinition | null>(null);
  const [payouts, setPayouts] = useState<WaterfallPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tiers' | 'participants' | 'periods' | 'distribution'>('tiers');
  const [showTierModal, setShowTierModal] = useState(false);
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [expandedTiers, setExpandedTiers] = useState<Set<number>>(new Set());

  // Form state for tiers
  const [tierForm, setTierForm] = useState<Omit<WaterfallTier, 'id' | 'waterfallId'>>({
    tierOrder: 1,
    pctSplit: 0,
    cap: undefined,
    description: '',
  });

  // Form state for participants
  const [participantForm, setParticipantForm] = useState<Omit<WaterfallParticipant, 'id' | 'waterfallId'>>({
    name: '',
    role: 'INVESTOR',
    pctShare: 0,
    investmentAmount: undefined,
    preferredReturn: undefined,
    capAmount: undefined,
    type: 'EQUITY',
    orderNo: 1,
  });

  // Form state for periods
  const [periodForm, setPeriodForm] = useState<Omit<WaterfallPeriod, 'id' | 'waterfallId'>>({
periodStart: (new Date().toISOString().split('T')[0] ?? ""),
periodEnd: (new Date().toISOString().split('T')[0] ?? ""),

    netRevenue: 0,
  });

  // Fetch or create waterfall
  useEffect(() => {
    fetchWaterfall();
  }, [projectId]);

  const fetchWaterfall = async () => {
    setLoading(true);
    try {
      const response = await getWaterfall(projectId);
      
      if (response.success && response.data) {
        setWaterfall(response.data);
      } else {
        // No waterfall exists, create one
        const createResponse = await createWaterfall(projectId);
        if (createResponse.success) {
          setWaterfall(createResponse.data);
        }
      }
    } catch (error) {
      console.error('Error fetching waterfall:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle tier submission
  const handleAddTier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waterfall) return;

    try {
      const response = await addTiers(projectId, waterfall.id, [tierForm]);
      if (response.success) {
        alert('Tier added successfully!');
        setShowTierModal(false);
        setTierForm({
          tierOrder: (waterfall.tiers?.length || 0) + 1,
          pctSplit: 0,
          cap: undefined,
          description: '',
        });
        fetchWaterfall();
      }
    } catch (error) {
      console.error('Error adding tier:', error);
      alert('Failed to add tier');
    }
  };

  // Handle participant submission
  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waterfall) return;

    try {
      const response = await addParticipants(projectId, waterfall.id, [participantForm]);
      if (response.success) {
        alert('Participant added successfully!');
        setShowParticipantModal(false);
        setParticipantForm({
          name: '',
          role: 'INVESTOR',
          pctShare: 0,
          investmentAmount: undefined,
          preferredReturn: undefined,
          capAmount: undefined,
          type: 'EQUITY',
          orderNo: (waterfall.participants?.length || 0) + 1,
        });
        fetchWaterfall();
      }
    } catch (error) {
      console.error('Error adding participant:', error);
      alert('Failed to add participant');
    }
  };

  // Handle period submission
  const handleAddPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waterfall) return;

    try {
      const response = await addRevenuePeriod(projectId, waterfall.id, periodForm);
      if (response.success) {
        alert('Revenue period added successfully!');
        setShowPeriodModal(false);
        setPeriodForm({
          periodStart: (new Date().toISOString().split("T")[0] ?? ""),
periodEnd: (new Date().toISOString().split("T")[0] ?? ""),

          netRevenue: 0,
        });
        fetchWaterfall();
      }
    } catch (error) {
      console.error('Error adding period:', error);
      alert('Failed to add period');
    }
  };

  // Handle calculate distribution
  const handleCalculateDistribution = async () => {
    if (!waterfall) return;

    try {
      const response = await calculateDistribution(projectId, waterfall.id);
      if (response.success) {
        setPayouts(response.data);
        alert('Distribution calculated successfully!');
      }
    } catch (error) {
      console.error('Error calculating distribution:', error);
      alert('Failed to calculate distribution');
    }
  };

  const toggleTier = (tierOrder: number) => {
    setExpandedTiers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tierOrder)) {
        newSet.delete(tierOrder);
      } else {
        newSet.add(tierOrder);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Project
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Waterfall Distribution</h1>
            <p className="text-gray-600">Manage investor revenue distribution tiers and calculations</p>
          </div>
          <button
            onClick={handleCalculateDistribution}
            disabled={!waterfall?.periods || waterfall.periods.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Calculator className="w-5 h-5" />
            Calculate Distribution
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200">
          {[
            { key: 'tiers', label: 'Tiers', icon: Layers },
            { key: 'participants', label: 'Participants', icon: Users },
            { key: 'periods', label: 'Revenue Periods', icon: DollarSign },
            { key: 'distribution', label: 'Payouts', icon: TrendingUp },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === key
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* Tiers Tab */}
        {activeTab === 'tiers' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Distribution Tiers</h2>
              <button
                onClick={() => setShowTierModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Tier
              </button>
            </div>

            {waterfall?.tiers && waterfall.tiers.length > 0 ? (
              <div className="space-y-4">
                {waterfall.tiers
                  .sort((a, b) => a.tierOrder - b.tierOrder)
                  .map((tier) => (
                    <div
                      key={tier.id}
                      className="border border-gray-200 rounded-lg overflow-hidden hover:border-blue-400 transition-colors"
                    >
                      <div
                        className="flex items-center justify-between p-4 cursor-pointer bg-gray-50 hover:bg-gray-100"
                        onClick={() => toggleTier(tier.tierOrder)}
                      >
                        <div className="flex items-center gap-4">
                          <span className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 font-bold rounded-full">
                            {tier.tierOrder}
                          </span>
                          <div>
                            <h3 className="font-semibold text-gray-900">{tier.description || `Tier ${tier.tierOrder}`}</h3>
                            <p className="text-sm text-gray-600">
                              {tier.pctSplit}% split
                              {tier.cap && ` • Capped at $${tier.cap.toLocaleString()}`}
                            </p>
                          </div>
                        </div>
                        {expandedTiers.has(tier.tierOrder) ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      {expandedTiers.has(tier.tierOrder) && (
                        <div className="p-4 bg-white border-t border-gray-200">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Tier Order</p>
                              <p className="font-semibold text-gray-900">{tier.tierOrder}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Split Percentage</p>
                              <p className="font-semibold text-gray-900">{tier.pctSplit}%</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Cap Amount</p>
                              <p className="font-semibold text-gray-900">
                                {tier.cap ? `$${tier.cap.toLocaleString()}` : 'No cap'}
                              </p>
                            </div>
                          </div>
                          {/* Show participants in this tier */}
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Participants in this tier:</h4>
                            <div className="space-y-2">
                              {waterfall.participants
                                ?.filter((p) => p.orderNo === tier.tierOrder)
                                .map((p) => (
                                  <div key={p.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <span className="text-sm text-gray-900">{p.name}</span>
                                    <span className="text-sm font-medium text-blue-600">{p.pctShare}%</span>
                                  </div>
                                )) || <p className="text-sm text-gray-500">No participants in this tier</p>}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Layers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No tiers yet</h3>
                <p className="text-gray-600 mb-6">Create distribution tiers to define revenue allocation</p>
                <button
                  onClick={() => setShowTierModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-5 h-5" />
                  Add First Tier
                </button>
              </div>
            )}
          </div>
        )}

        {/* Participants Tab */}
        {activeTab === 'participants' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Participants</h2>
              <button
                onClick={() => setShowParticipantModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Participant
              </button>
            </div>

            {waterfall?.participants && waterfall.participants.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Share %</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Investment</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Preferred Return</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Tier</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Recouped</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {waterfall.participants
                      .sort((a, b) => (a.orderNo || 0) - (b.orderNo || 0))
                      .map((participant) => (
                        <tr key={participant.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{participant.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              {participant.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">{participant.type || '-'}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-gray-900">
                            {participant.pctShare}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                            {participant.investmentAmount
                              ? `$${participant.investmentAmount.toLocaleString()}`
                              : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                            {participant.preferredReturn ? `${participant.preferredReturn}%` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-700 font-semibold rounded-full">
                              {participant.orderNo || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-green-600">
                            ${(participant.recoupedAmount || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No participants yet</h3>
                <p className="text-gray-600 mb-6">Add investors and stakeholders to the waterfall</p>
                <button
                  onClick={() => setShowParticipantModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-5 h-5" />
                  Add First Participant
                </button>
              </div>
            )}
          </div>
        )}

        {/* Revenue Periods Tab */}
        {activeTab === 'periods' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Revenue Periods</h2>
              <button
                onClick={() => setShowPeriodModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Period
              </button>
            </div>

            {waterfall?.periods && waterfall.periods.length > 0 ? (
              <div className="space-y-4">
                {waterfall.periods.map((period, index) => (
                  <div
                    key={period.id || index}
                    className="p-6 border border-gray-200 rounded-lg hover:border-blue-400 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Period {index + 1}: {new Date(period.periodStart).toLocaleDateString()} -{' '}
                            {new Date(period.periodEnd).toLocaleDateString()}
                          </h3>
                          <p className="text-sm text-gray-600">Net revenue for distribution</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          ${period.netRevenue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Start Date</p>
                        <p className="font-medium text-gray-900">
                          {new Date(period.periodStart).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">End Date</p>
                        <p className="font-medium text-gray-900">
                          {new Date(period.periodEnd).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Net Revenue</p>
                        <p className="font-medium text-gray-900">${period.netRevenue.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No revenue periods yet</h3>
                <p className="text-gray-600 mb-6">Add revenue periods to track income over time</p>
                <button
                  onClick={() => setShowPeriodModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-5 h-5" />
                  Add First Period
                </button>
              </div>
            )}
          </div>
        )}

        {/* Distribution/Payouts Tab */}
        {activeTab === 'distribution' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Calculated Payouts</h2>
              {payouts.length === 0 && (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Click "Calculate Distribution" to generate payouts</span>
                </div>
              )}
            </div>

            {payouts.length > 0 ? (
              <div className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-600 mb-1">Total Distributed</p>
                    <p className="text-2xl font-bold text-blue-900">
                      ${payouts.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-600 mb-1">Participants Paid</p>
                    <p className="text-2xl font-bold text-green-900">
                      {new Set(payouts.map((p) => p.participantId)).size}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-sm text-purple-600 mb-1">Periods Processed</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {waterfall?.periods?.length || 0}
                    </p>
                  </div>
                </div>

                {/* Payouts Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                          Participant
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                          Period
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">
                          Payout Amount
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {payouts.map((payout) => (
                        <tr key={payout.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                {payout.participant?.name?.substring(0, 2).toUpperCase() || 'P'}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {payout.participant?.name || 'Unknown'}
                                </div>
                                <div className="text-sm text-gray-500">{payout.participant?.role}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(payout.periodStart).toLocaleDateString()} -{' '}
                            {new Date(payout.periodEnd).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className="text-lg font-bold text-green-600">
                              ${payout.amount.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              Calculated
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No payouts calculated</h3>
                <p className="text-gray-600 mb-6">
                  Add tiers, participants, and revenue periods, then click "Calculate Distribution"
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tier Modal */}
      {showTierModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add Tier</h2>
              <button
                onClick={() => setShowTierModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddTier} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tier Order</label>
                <input
                  type="number"
                  min="1"
                  value={tierForm.tierOrder}
                  onChange={(e) => setTierForm({ ...tierForm, tierOrder: Number(e.target.value) })}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  value={tierForm.description}
                  onChange={(e) => setTierForm({ ...tierForm, description: e.target.value })}
                  placeholder="e.g., Preferred Return"
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Split Percentage (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={tierForm.pctSplit}
                  onChange={(e) => setTierForm({ ...tierForm, pctSplit: Number(e.target.value) })}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cap Amount (Optional)</label>
                <input
                  type="number"
                  min="0"
                  value={tierForm.cap || ''}
                  onChange={(e) =>
                    setTierForm({ ...tierForm, cap: e.target.value ? Number(e.target.value) : undefined })
                  }
                  placeholder="No cap"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTierModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Tier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Participant Modal */}
      {showParticipantModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add Participant</h2>
              <button
                onClick={() => setShowParticipantModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddParticipant} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={participantForm.name}
                    onChange={(e) => setParticipantForm({ ...participantForm, name: e.target.value })}
                    required
                    placeholder="John Doe"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    value={participantForm.role}
                    onChange={(e) => setParticipantForm({ ...participantForm, role: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="INVESTOR">Investor</option>
                    <option value="PRODUCER">Producer</option>
                    <option value="DISTRIBUTOR">Distributor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={participantForm.type}
                    onChange={(e) => setParticipantForm({ ...participantForm, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="EQUITY">Equity</option>
                    <option value="DEBT">Debt</option>
                    <option value="PROFIT_PARTICIPATION">Profit Participation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tier Order</label>
                  <input
                    type="number"
                    min="1"
                    value={participantForm.orderNo}
                    onChange={(e) => setParticipantForm({ ...participantForm, orderNo: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Share Percentage (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={participantForm.pctShare}
                    onChange={(e) => setParticipantForm({ ...participantForm, pctShare: Number(e.target.value) })}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Investment Amount</label>
                  <input
                    type="number"
                    min="0"
                    value={participantForm.investmentAmount || ''}
                    onChange={(e) =>
                      setParticipantForm({
                        ...participantForm,
                        investmentAmount: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    placeholder="Optional"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Return (%)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={participantForm.preferredReturn || ''}
                    onChange={(e) =>
                      setParticipantForm({
                        ...participantForm,
                        preferredReturn: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    placeholder="Optional"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cap Amount</label>
                  <input
                    type="number"
                    min="0"
                    value={participantForm.capAmount || ''}
                    onChange={(e) =>
                      setParticipantForm({
                        ...participantForm,
                        capAmount: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    placeholder="Optional"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowParticipantModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Participant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Period Modal */}
      {showPeriodModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add Revenue Period</h2>
              <button
                onClick={() => setShowPeriodModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddPeriod} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={periodForm.periodStart}
                  onChange={(e) => setPeriodForm({ ...periodForm, periodStart: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={periodForm.periodEnd}
                  onChange={(e) => setPeriodForm({ ...periodForm, periodEnd: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Net Revenue</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={periodForm.netRevenue}
                  onChange={(e) => setPeriodForm({ ...periodForm, netRevenue: Number(e.target.value) })}
                  required
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPeriodModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
