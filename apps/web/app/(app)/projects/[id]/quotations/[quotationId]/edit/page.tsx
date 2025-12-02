"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FileText,
  DollarSign,
  TrendingUp,
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Calculator,
  X,
  AlertCircle,
} from "lucide-react";
import {
  getQuotation,
  updateQuotation,
  calculateROI,
} from "../../../../../lib/api/quotation";
import type {
  QuotationAssumptions,
  FinancingPlan,
  RevenueModel,
  BudgetLine,
} from "../../../../../lib/types/quotation";

export default function EditQuotationPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const quotationId = params.quotationId as string;

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [version, setVersion] = useState("");
  const [template, setTemplate] = useState<"FEATURE" | "SERIES" | "SHORT">("FEATURE");
  const [assumptions, setAssumptions] = useState<QuotationAssumptions>({
    currency: "USD",
    taxPercent: 13,
    contingencyPercent: 10,
    insurancePercent: 2,
    bondPercent: 3,
    phases: ["DEVELOPMENT", "PRODUCTION", "POST", "PUBLICITY"],
  });
  const [budgetLines, setBudgetLines] = useState<Partial<BudgetLine>[]>([]);
  const [financingPlan, setFinancingPlan] = useState<FinancingPlan>({
    sources: [{ type: "EQUITY", amount: 0, description: "" }],
  });
  const [revenueModel, setRevenueModel] = useState<RevenueModel>({
    grossRevenue: 0,
    distributionFeePercent: 20,
    territoryBreakdown: [],
  });
  const [roiParams, setRoiParams] = useState({
    productionPeriodMonths: 12,
    revenuePeriodYears: 3,
    discountRate: 0.10,
  });

  useEffect(() => {
    if (projectId && quotationId) {
      fetchQuotation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, quotationId]);

  const fetchQuotation = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getQuotation(projectId, quotationId);

      if (response.success) {
        const quotation = response.data;

        if (quotation.lockedAt) {
          setError("This quotation is locked and cannot be edited.");
          return;
        }

        setVersion(quotation.version || "");
        setTemplate(quotation.template || "FEATURE");
        setAssumptions(
          quotation.assumptions || {
            currency: "USD",
            taxPercent: 13,
            contingencyPercent: 10,
            insurancePercent: 2,
            bondPercent: 3,
            phases: ["DEVELOPMENT", "PRODUCTION", "POST", "PUBLICITY"],
          }
        );
        setBudgetLines(quotation.lines || []);
        setFinancingPlan(
          quotation.financingPlan || {
            sources: [{ type: "EQUITY", amount: 0, description: "" }],
          }
        );
        setRevenueModel(
          quotation.revenueModel || {
            grossRevenue: 0,
            distributionFeePercent: 20,
            territoryBreakdown: [],
          }
        );
      } else {
        throw new Error(response.message || "Failed to fetch quotation");
      }
    } catch (err: any) {
      console.error("Error fetching quotation:", err);
      setError(err.message || "Failed to load quotation");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, name: "Template & Assumptions", icon: FileText },
    { id: 2, name: "Budget Lines", icon: DollarSign },
    { id: 3, name: "Financing Plan", icon: DollarSign },
    { id: 4, name: "Revenue Model", icon: TrendingUp },
    { id: 5, name: "Review & Calculate", icon: Calculator },
  ];

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const cleanedLines = budgetLines.map((line) => ({
        phase: line.phase || "PRODUCTION",
        department: line.department || "",
        name: line.name || "",
        qty: Number(line.qty ?? 1),
        rate: Number(line.rate ?? 0),
        taxPercent: Number(line.taxPercent ?? assumptions.taxPercent ?? 0),
        vendor: (line as any).vendor || "",
        notes: line.notes || "",
      }));

      const quotationData = {
        version,
        template,
        assumptions: {
          currency: assumptions.currency,
          taxPercent: Number(assumptions.taxPercent ?? 0),
          contingencyPercent: Number(assumptions.contingencyPercent ?? 0),
          insurancePercent: Number(assumptions.insurancePercent ?? 0),
          bondPercent: Number(assumptions.bondPercent ?? 0),
          phases: assumptions.phases,
        },
        financingPlan: {
          sources: financingPlan.sources.map((s) => ({
            type: s.type,
            amount: Number(s.amount ?? 0),
            rate: Number(s.rate ?? 0),
            description: s.description || "",
          })),
        },
        revenueModel: {
          grossRevenue: Number(revenueModel.grossRevenue ?? 0),
          distributionFeePercent: Number(revenueModel.distributionFeePercent ?? 20),
          territoryBreakdown: (revenueModel.territoryBreakdown ?? []).map((t) => ({
  territory: t.territory,
  window: t.window,
  revenue: Number(t.revenue ?? 0),
})),

        },
        lines: cleanedLines,
      };

      const response = await updateQuotation(projectId, quotationId, quotationData);

      if (!response.success) {
        throw new Error(response.message || "Failed to update quotation");
      }

      await calculateROI(projectId, quotationId, {
        projectedRevenue: Number(revenueModel.grossRevenue ?? 0),
        distributionFeePercent: Number(revenueModel.distributionFeePercent ?? 20),
        productionPeriodMonths: roiParams.productionPeriodMonths,
        revenuePeriodYears: roiParams.revenuePeriodYears,
        discountRate: roiParams.discountRate,
      });

      alert("Quotation updated successfully!");
      router.push(`/projects/${projectId}/quotations`);
    } catch (err: any) {
      console.error("Error updating quotation:", err);
      alert(err.message || "Failed to update quotation");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-semibold text-red-900">Error</h2>
          </div>
          <p className="text-red-800 mb-4">{error}</p>
          <button
            onClick={() => router.push(`/projects/${projectId}/quotations`)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Back to Quotations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => router.push(`/projects/${projectId}/quotations`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Quotations
        </button>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-blue-100 rounded-lg">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Investor Quotation</h1>
        </div>
        <p className="text-gray-600">Update quotation with cost breakdown and ROI projections</p>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex-1 flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentStep >= step.id ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  <step.icon className="w-5 h-5" />
                </div>
                <div className="hidden md:block">
                  <p className={`text-sm font-medium ${currentStep >= step.id ? "text-blue-600" : "text-gray-600"}`}>
                    {step.name}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-4 ${currentStep > step.id ? "bg-blue-600" : "bg-gray-200"}`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        {currentStep === 1 && (
          <Step1TemplateAssumptions
            template={template}
            setTemplate={setTemplate}
            version={version}
            setVersion={setVersion}
            assumptions={assumptions}
            setAssumptions={setAssumptions}
          />
        )}
        {currentStep === 2 && (
          <Step2BudgetLines
            budgetLines={budgetLines}
            setBudgetLines={setBudgetLines}
            assumptions={assumptions}
          />
        )}
        {currentStep === 3 && (
          <Step3FinancingPlan
            financingPlan={financingPlan}
            setFinancingPlan={setFinancingPlan}
            assumptions={assumptions}
          />
        )}
        {currentStep === 4 && (
          <Step4RevenueModel
            revenueModel={revenueModel}
            setRevenueModel={setRevenueModel}
            assumptions={assumptions}
          />
        )}
        {currentStep === 5 && (
          <Step5ReviewCalculate
            version={version}
            budgetLines={budgetLines}
            financingPlan={financingPlan}
            revenueModel={revenueModel}
            roiParams={roiParams}
            setRoiParams={setRoiParams}
            assumptions={assumptions}
          />
        )}
      </div>

      <div className="flex justify-between">
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>
        {currentStep < 5 ? (
          <button onClick={handleNext} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            {submitting ? "Updating..." : "Update Quotation"}
          </button>
        )}
      </div>
    </div>
  );
}

// ============ STEP COMPONENTS ============

function Step1TemplateAssumptions({ template, setTemplate, version, setVersion, assumptions, setAssumptions }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Template & Basic Info</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Version Name</label>
          <input
            type="text"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., v1.0, Quote for Investor A"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Project Template</label>
          <div className="grid grid-cols-3 gap-4">
            {["FEATURE", "SERIES", "SHORT"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTemplate(t as any)}
                className={`p-4 border-2 rounded-lg text-center transition-all ${
                  template === t ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <p className="font-medium text-gray-900">{t}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Assumptions</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
            <select
              value={assumptions.currency}
              onChange={(e) => setAssumptions({ ...assumptions, currency: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="USD">USD</option>
              <option value="NPR">NPR</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tax Rate (%)</label>
            <input
              type="number"
              value={assumptions.taxPercent}
              onChange={(e) => setAssumptions({ ...assumptions, taxPercent: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              max="100"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contingency (%)</label>
            <input
              type="number"
              value={assumptions.contingencyPercent}
              onChange={(e) => setAssumptions({ ...assumptions, contingencyPercent: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              max="100"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Insurance (%)</label>
            <input
              type="number"
              value={assumptions.insurancePercent}
              onChange={(e) => setAssumptions({ ...assumptions, insurancePercent: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              max="100"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Completion Bond (%)</label>
            <input
              type="number"
              value={assumptions.bondPercent}
              onChange={(e) => setAssumptions({ ...assumptions, bondPercent: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              max="100"
              step="0.1"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Step2BudgetLines({ budgetLines, setBudgetLines, assumptions }: any) {
  const [showAddLine, setShowAddLine] = useState(false);
  const [newLine, setNewLine] = useState({
    phase: "PRODUCTION",
    department: "",
    name: "",
    qty: 1,
    rate: 0,
    taxPercent: assumptions.taxPercent,
  });

  const addLine = () => {
    setBudgetLines([...budgetLines, { ...newLine, id: Date.now().toString() }]);
    setNewLine({
      phase: "PRODUCTION",
      department: "",
      name: "",
      qty: 1,
      rate: 0,
      taxPercent: assumptions.taxPercent,
    });
    setShowAddLine(false);
  };

  const deleteLine = (id: string) => {
    setBudgetLines(budgetLines.filter((line: any) => line.id !== id));
  };

  const calculateLineTotal = (line: any) => {
    const subtotal = line.qty * line.rate;
    const tax = (subtotal * (line.taxPercent || 0)) / 100;
    return subtotal + tax;
  };

  const calculateGrandTotal = () => {
    return budgetLines.reduce((sum: number, line: any) => sum + calculateLineTotal(line), 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: assumptions.currency || "USD",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Budget Lines</h3>
          <p className="text-sm text-gray-600">Add cost items grouped by phase and department</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddLine(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Line
        </button>
      </div>

      {budgetLines.length > 0 ? (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phase</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rate</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tax %</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {budgetLines.map((line: any) => (
                <tr key={line.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">{line.phase}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{line.department}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{line.name}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">{line.qty}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(line.rate)}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">{line.taxPercent}%</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                    {formatCurrency(calculateLineTotal(line))}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <button type="button" onClick={() => deleteLine(line.id)} className="text-red-600 hover:text-red-800">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={6} className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">Grand Total</td>
                <td className="px-4 py-3 text-sm font-bold text-blue-600 text-right">{formatCurrency(calculateGrandTotal())}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No budget lines added yet</p>
          <button
            type="button"
            onClick={() => setShowAddLine(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add First Line
          </button>
        </div>
      )}

      {showAddLine && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Budget Line</h3>
              <button type="button" onClick={() => setShowAddLine(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phase</label>
                <select
                  value={newLine.phase}
                  onChange={(e) => setNewLine({ ...newLine, phase: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DEVELOPMENT">Development</option>
                  <option value="PRODUCTION">Production</option>
                  <option value="POST">Post Production</option>
                  <option value="PUBLICITY">Publicity</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  value={newLine.department}
                  onChange={(e) => setNewLine({ ...newLine, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Camera, Cast, Editing"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                <input
                  type="text"
                  value={newLine.name}
                  onChange={(e) => setNewLine({ ...newLine, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Camera Rental, Lead Actor"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={newLine.qty}
                    onChange={(e) => setNewLine({ ...newLine, qty: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rate</label>
                  <input
                    type="number"
                    value={newLine.rate}
                    onChange={(e) => setNewLine({ ...newLine, rate: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax %</label>
                <input
                  type="number"
                  value={newLine.taxPercent}
                  onChange={(e) => setNewLine({ ...newLine, taxPercent: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowAddLine(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addLine}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Line
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Step3FinancingPlan({ financingPlan, setFinancingPlan, assumptions }: any) {
  const addSource = () => {
    setFinancingPlan({
      ...financingPlan,
      sources: [...financingPlan.sources, { type: "EQUITY", amount: 0, rate: 0, description: "" }],
    });
  };

  const updateSource = (index: number, field: string, value: any) => {
    const newSources = [...financingPlan.sources];
    newSources[index] = { ...newSources[index], [field]: value };
    setFinancingPlan({ ...financingPlan, sources: newSources });
  };

  const removeSource = (index: number) => {
    setFinancingPlan({
      ...financingPlan,
      sources: financingPlan.sources.filter((_: any, i: number) => i !== index),
    });
  };

  const getTotalFinancing = () => {
    return financingPlan.sources.reduce((sum: number, source: any) => sum + (source.amount || 0), 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: assumptions.currency || "USD",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Financing Plan</h3>
          <p className="text-sm text-gray-600">Define how the project will be funded</p>
        </div>
        <button
          type="button"
          onClick={addSource}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Source
        </button>
      </div>

      <div className="space-y-4">
        {financingPlan.sources.map((source: any, index: number) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-4">
              <span className="text-xs px-2 py-1 rounded font-medium bg-blue-100 text-blue-800">{source.type}</span>
              <button type="button" onClick={() => removeSource(index)} className="text-red-600 hover:text-red-800">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={source.type}
                  onChange={(e) => updateSource(index, "type", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="EQUITY">Equity Investment</option>
                  <option value="LOAN">Loan</option>
                  <option value="GRANT">Grant</option>
                  <option value="INCENTIVE">Tax Incentive</option>
                  <option value="MG">Minimum Guarantee</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  value={source.amount}
                  onChange={(e) => updateSource(index, "amount", parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  min="0"
                  step="1000"
                />
              </div>
              {source.type === "LOAN" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</label>
                  <input
                    type="number"
                    value={source.rate || 0}
                    onChange={(e) => updateSource(index, "rate", parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="5.0"
                    min="0"
                    step="0.1"
                  />
                </div>
              )}
              <div className={source.type === "LOAN" ? "" : "md:col-span-2"}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={source.description}
                  onChange={(e) => updateSource(index, "description", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Series A Investors, Bank Loan"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-900 font-medium">Total Financing</p>
            <p className="text-xs text-blue-700 mt-1">
              {financingPlan.sources.length} source{financingPlan.sources.length !== 1 ? "s" : ""}
            </p>
          </div>
          <p className="text-2xl font-bold text-blue-900">{formatCurrency(getTotalFinancing())}</p>
        </div>
      </div>
    </div>
  );
}

function Step4RevenueModel({ revenueModel, setRevenueModel, assumptions }: any) {
  const [showAddTerritory, setShowAddTerritory] = useState(false);
  const [newTerritory, setNewTerritory] = useState({
    territory: "",
    window: "",
    revenue: 0,
  });

  const addTerritory = () => {
    setRevenueModel({
      ...revenueModel,
      territoryBreakdown: [...revenueModel.territoryBreakdown, { ...newTerritory, id: Date.now().toString() }],
    });
    setNewTerritory({ territory: "", window: "", revenue: 0 });
    setShowAddTerritory(false);
  };

  const deleteTerritory = (id: string) => {
    setRevenueModel({
      ...revenueModel,
      territoryBreakdown: revenueModel.territoryBreakdown.filter((t: any) => t.id !== id),
    });
  };

  const getTerritoryTotal = () => {
    return revenueModel.territoryBreakdown.reduce((sum: number, t: any) => sum + (t.revenue || 0), 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: assumptions.currency || "USD",
    }).format(amount);
  };

  const calculateNetRevenue = () => {
    const gross = revenueModel.grossRevenue || 0;
    const fee = (gross * revenueModel.distributionFeePercent) / 100;
    return gross - fee;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Projections</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Projected Gross Revenue</label>
            <input
              type="number"
              value={revenueModel.grossRevenue}
              onChange={(e) => setRevenueModel({ ...revenueModel, grossRevenue: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
              min="0"
              step="10000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Distribution Fee (%)</label>
            <input
              type="number"
              value={revenueModel.distributionFeePercent}
              onChange={(e) =>
                setRevenueModel({ ...revenueModel, distributionFeePercent: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="20"
              min="0"
              max="100"
              step="1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 font-medium mb-1">Gross Revenue</p>
            <p className="text-2xl font-bold text-blue-900">{formatCurrency(revenueModel.grossRevenue || 0)}</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-900 font-medium mb-1">Distribution Fees</p>
            <p className="text-2xl font-bold text-orange-900">
              -{formatCurrency(((revenueModel.grossRevenue || 0) * revenueModel.distributionFeePercent) / 100)}
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-900 font-medium mb-1">Net Revenue</p>
            <p className="text-2xl font-bold text-green-900">{formatCurrency(calculateNetRevenue())}</p>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-base font-semibold text-gray-900">Territory Breakdown</h4>
            <p className="text-sm text-gray-600">Optional: Break down revenue by territory/window</p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddTerritory(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Territory
          </button>
        </div>

        {revenueModel.territoryBreakdown && revenueModel.territoryBreakdown.length > 0 ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Territory</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Window</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {revenueModel.territoryBreakdown.map((territory: any) => (
                  <tr key={territory.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{territory.territory}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{territory.window}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                      {formatCurrency(territory.revenue)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <button
                        type="button"
                        onClick={() => deleteTerritory(territory.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                    Territory Total
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-blue-600 text-right">
                    {formatCurrency(getTerritoryTotal())}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-500 text-sm">No territory breakdown added</p>
          </div>
        )}
      </div>

      {showAddTerritory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Territory</h3>
              <button
                type="button"
                onClick={() => setShowAddTerritory(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Territory</label>
                <input
                  type="text"
                  value={newTerritory.territory}
                  onChange={(e) => setNewTerritory({ ...newTerritory, territory: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., North America, Europe, Asia"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Window</label>
                <select
                  value={newTerritory.window}
                  onChange={(e) => setNewTerritory({ ...newTerritory, window: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select window</option>
                  <option value="Theatrical">Theatrical</option>
                  <option value="OTT">OTT/Streaming</option>
                  <option value="TV">Television</option>
                  <option value="VOD">Video on Demand</option>
                  <option value="DVD">DVD/Blu-ray</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Revenue</label>
                <input
                  type="number"
                  value={newTerritory.revenue}
                  onChange={(e) => setNewTerritory({ ...newTerritory, revenue: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  min="0"
                  step="1000"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowAddTerritory(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addTerritory}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Territory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Step5ReviewCalculate({
  version,
  budgetLines,
  financingPlan,
  revenueModel,
  roiParams,
  setRoiParams,
  assumptions,
}: any) {
  const calculateTotalCost = () => {
    return budgetLines.reduce((sum: number, line: any) => {
      const subtotal = line.qty * line.rate;
      const tax = (subtotal * (line.taxPercent || 0)) / 100;
      return sum + subtotal + tax;
    }, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: assumptions.currency || "USD",
    }).format(amount);
  };

  const previewCalculation = () => {
    const totalCost = calculateTotalCost();
    const projectedRevenue = revenueModel.grossRevenue;
    const distFee = (projectedRevenue * revenueModel.distributionFeePercent) / 100;
    const netRevenue = projectedRevenue - distFee;
    const profit = netRevenue - totalCost;
    const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;

    return { totalCost, projectedRevenue, distFee, netRevenue, profit, roi };
  };

  const preview = previewCalculation();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quotation Summary</h3>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Version</p>
              <p className="text-lg font-bold text-gray-900">{version}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Currency</p>
              <p className="text-lg font-bold text-gray-900">{assumptions.currency}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Budget Lines</p>
            <p className="text-2xl font-bold text-gray-900">{budgetLines.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Total Cost</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(preview.totalCost)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Financing Sources</p>
            <p className="text-2xl font-bold text-gray-900">{financingPlan.sources.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Projected Revenue</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(preview.projectedRevenue)}</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick ROI Preview</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-700 mb-1">Net Revenue</p>
              <p className="text-xl font-bold text-blue-900">{formatCurrency(preview.netRevenue)}</p>
              <p className="text-xs text-gray-600 mt-1">After {revenueModel.distributionFeePercent}% distribution fee</p>
            </div>
            <div>
              <p className="text-sm text-gray-700 mb-1">Projected Profit</p>
              <p className={`text-xl font-bold ${preview.profit >= 0 ? "text-green-900" : "text-red-900"}`}>
                {formatCurrency(preview.profit)}
              </p>
              <p className="text-xs text-gray-600 mt-1">Net revenue minus total cost</p>
            </div>
            <div>
              <p className="text-sm text-gray-700 mb-1">Simple ROI</p>
              <p className={`text-xl font-bold ${preview.roi >= 0 ? "text-green-900" : "text-red-900"}`}>
                {preview.roi.toFixed(2)}%
              </p>
              <p className="text-xs text-gray-600 mt-1">Basic return on investment</p>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4 mb-6">
          <h4 className="text-base font-semibold text-gray-900 mb-4">Advanced ROI Parameters</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Production Period (months)</label>
              <input
                type="number"
                value={roiParams.productionPeriodMonths}
                onChange={(e) => setRoiParams({ ...roiParams, productionPeriodMonths: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
                step="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Revenue Period (years)</label>
              <input
                type="number"
                value={roiParams.revenuePeriodYears}
                onChange={(e) => setRoiParams({ ...roiParams, revenuePeriodYears: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
                step="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Rate</label>
              <input
                type="number"
                value={roiParams.discountRate}
                onChange={(e) => setRoiParams({ ...roiParams, discountRate: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
                max="1"
                step="0.01"
              />
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-900">
            <strong>Note:</strong> Click "Update Quotation" to save changes and calculate detailed ROI metrics including
            IRR and NPV.
          </p>
        </div>
      </div>
    </div>
  );
}
