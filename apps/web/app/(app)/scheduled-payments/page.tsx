"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://film-finance-app.onrender.com/api";

interface Installment {
  id: string;
  scheduledPaymentId: string;
  dueDate: string;
  amount: number;
  status: string;
}

interface Allocation {
  id: string;
  phase: string;
  lineRefId?: string;
  amount: number;
}

interface ScheduledPayment {
  id: string;
  payeeId: string;
  total: number;
  paidAmount?: number;
  remainingAmount?: number;
  status: string;
  createdAt: string;
  payee?: {
    name: string;
    currency: string;
  };
  installments: Installment[];
  allocations: Allocation[];
}

interface Vendor {
  id: string;
  name: string;
  currency: string;
}

interface Project {
  id: string;
  title: string;
}

interface InstallmentForm {
  dueDate: string;
  amount: number;
}

interface AllocationForm {
  phase: string;
  amount: number;
}

interface FormData {
  payeeId: string;
  total: number;
  installments: InstallmentForm[];
  allocations: AllocationForm[];
}

interface UpcomingInstallment extends Installment {
  paymentId: string;
  vendor?: string;
}

export default function ScheduledPaymentsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [scheduledPayments, setScheduledPayments] = useState<
    ScheduledPayment[]
  >([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedPayment, setExpandedPayment] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    payeeId: "",
    total: 0,
    installments: [
      { dueDate: "", amount: 0 },
      { dueDate: "", amount: 0 },
    ],
    allocations: [{ phase: "PRODUCTION", amount: 0 }],
  });

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch vendors and scheduled payments when project changes
  useEffect(() => {
    if (selectedProjectId) {
      fetchVendors(selectedProjectId);
      fetchScheduledPayments(selectedProjectId);
    } else {
      setScheduledPayments([]);
      setVendors([]);
    }
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects?limit=99999`, {
        credentials: "include",
      });
      const result = await response.json();
      if (result.success) {
        setProjects(result.data.projects || []);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchVendors = async (projectId: string) => {
    if (!projectId) {
      setVendors([]);
      return;
    }

    try {
      console.log("🔍 Fetching vendors for project:", projectId);

      const response = await fetch(
        `${API_BASE_URL}/vendors/project/${projectId}`,
        { credentials: "include" }
      );

      console.log("📡 Vendors response status:", response.status);

      if (!response.ok) {
        console.error("❌ Failed to fetch vendors");
        setVendors([]);
        return;
      }

      const result = await response.json();
      console.log("📦 Vendors response:", result);

      if (result.success) {
        setVendors(result.data?.vendors || []);
      } else {
        console.error("❌ API returned error:", result.message);
        setVendors([]);
      }
    } catch (error) {
      console.error("💥 Error fetching vendors:", error);
      setVendors([]);
    }
  };

  const fetchScheduledPayments = async (projectId: string) => {
    if (!projectId) {
      setScheduledPayments([]);
      return;
    }

    setLoading(true);
    try {
      console.log("🔍 Fetching scheduled payments for project:", projectId);

      const response = await fetch(
        `${API_BASE_URL}/payments/project/${projectId}/scheduled`,
        { credentials: "include" }
      );

      console.log("📡 Scheduled payments response status:", response.status);

      if (!response.ok) {
        console.error("❌ Failed to fetch scheduled payments");
        setScheduledPayments([]);
        return;
      }

      const result = await response.json();
      console.log("📦 Scheduled payments response:", result);

      if (result.success) {
        setScheduledPayments(result.data.scheduledPayments || []);
      } else {
        console.error("❌ API returned error:", result.message);
        setScheduledPayments([]);
      }
    } catch (error) {
      console.error("💥 Error fetching scheduled payments:", error);
      setScheduledPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateScheduledPayment = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!selectedProjectId) {
      alert("Please select a project first");
      return;
    }

    const installmentTotal = formData.installments.reduce(
      (sum, inst) => sum + Number(inst.amount),
      0
    );
    if (Math.abs(installmentTotal - formData.total) > 0.01) {
      alert(
        `Installments (${installmentTotal}) must equal total (${formData.total})`
      );
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/payments/project/${selectedProjectId}/scheduled`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();
      if (result.success) {
        alert("Scheduled payment created successfully");
        setShowCreateModal(false);
        resetForm();
        fetchScheduledPayments(selectedProjectId);
      } else {
        alert(result.message || "Failed to create scheduled payment");
      }
    } catch (error) {
      console.error("Error creating scheduled payment:", error);
      alert("Failed to create scheduled payment");
    }
  };

  const handleMarkInstallmentPaid = async (
    scheduledPaymentId: string,
    installmentId: string,
    amount: number
  ) => {
    if (!confirm("Mark this installment as paid?")) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/payments/project/${selectedProjectId}/scheduled/${scheduledPaymentId}/installments/${installmentId}/pay`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            paidAmount: amount,
            paymentMethod: "Bank Transfer",
            paidDate: new Date().toISOString(),
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        alert("Installment marked as paid");
        if (selectedProjectId) {
          fetchScheduledPayments(selectedProjectId);
        }
      } else {
        alert(result.message || "Failed to update installment");
      }
    } catch (error) {
      console.error("Error updating installment:", error);
      alert("Failed to update installment");
    }
  };

  const addInstallment = () => {
    const newInstallment: InstallmentForm = { dueDate: "", amount: 0 };
    setFormData((prev) => ({
      ...prev,
      installments: [...prev.installments, newInstallment],
    }));
  };

  const removeInstallment = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      installments: prev.installments.filter((_, i) => i !== index),
    }));
  };

  const updateInstallment = (
    index: number,
    field: keyof InstallmentForm,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      installments: prev.installments.map((inst, i) =>
        i === index
          ? {
              ...inst,
              [field]: field === "amount" ? Number(value) : value,
            }
          : inst
      ),
    }));
  };

  const addAllocation = () => {
    const newAllocation: AllocationForm = { phase: "PRODUCTION", amount: 0 };
    setFormData((prev) => ({
      ...prev,
      allocations: [...prev.allocations, newAllocation],
    }));
  };

  const removeAllocation = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      allocations: prev.allocations.filter((_, i) => i !== index),
    }));
  };

  const updateAllocation = (
    index: number,
    field: keyof AllocationForm,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      allocations: prev.allocations.map((alloc, i) =>
        i === index
          ? {
              ...alloc,
              [field]: field === "amount" ? Number(value) : value,
            }
          : alloc
      ),
    }));
  };

  const resetForm = () => {
    setFormData({
      payeeId: "",
      total: 0,
      installments: [
        { dueDate: "", amount: 0 },
        { dueDate: "", amount: 0 },
      ],
      allocations: [{ phase: "PRODUCTION", amount: 0 }],
    });
  };

  const handleProjectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedProjectId(e.target.value);
  };

  const handlePayeeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, payeeId: e.target.value }));
  };

  const handleTotalChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, total: Number(e.target.value) }));
  };

  const formatCurrency = (amount: number) =>
    amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const getUpcomingInstallments = (): UpcomingInstallment[] => {
    const upcoming: UpcomingInstallment[] = [];
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    scheduledPayments.forEach((payment) => {
      payment.installments.forEach((installment) => {
        if (
          installment.status === "Pending" &&
          new Date(installment.dueDate) <= thirtyDaysFromNow
        ) {
          upcoming.push({
            ...installment,
            paymentId: payment.id,
            vendor: payment.payee?.name,
          });
        }
      });
    });

    return upcoming.sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const totalScheduled = scheduledPayments.reduce((sum, p) => sum + p.total, 0);
  const totalRemaining = scheduledPayments.reduce(
    (sum, p) => sum + (p.remainingAmount || 0),
    0
  );
  const totalPaid = scheduledPayments.reduce(
    (sum, p) => sum + (p.paidAmount || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
          <div>
            <p className="text-xs font-semibold tracking-widest text-blue-600 uppercase mb-1">
              Cash Commitments
            </p>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              Scheduled Payments & Installments
            </h1>
            <p className="text-slate-600 mt-2 text-sm lg:text-base">
              Plan vendor payments by installments, allocate by phase, and keep
              your runway under control.
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">
                Project
              </span>
              <select
                value={selectedProjectId}
                onChange={handleProjectChange}
                className="h-10 rounded-lg border border-slate-300 px-3 text-sm bg-white min-w-[220px]"
              >
                <option value="">-- Select Project --</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>
            {selectedProjectId && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="px-4 h-10 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow-md hover:bg-blue-700"
              >
                Create Scheduled Payment
              </button>
            )}
          </div>
        </div>

        {/* KPIs */}
        {selectedProjectId && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
              <div className="text-xs text-slate-500 uppercase mb-1">
                Total Scheduled
              </div>
              <div className="text-2xl font-bold text-slate-900">
                ${formatCurrency(totalScheduled)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                All vendor commitments
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-white shadow-sm p-4">
              <div className="text-xs text-slate-500 uppercase mb-1">
                Total Paid
              </div>
              <div className="text-2xl font-bold text-emerald-600">
                ${formatCurrency(totalPaid)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Across all installments
              </div>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-white shadow-sm p-4">
              <div className="text-xs text-slate-500 uppercase mb-1">
                Remaining
              </div>
              <div className="text-2xl font-bold text-amber-600">
                ${formatCurrency(totalRemaining)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Yet to be paid
              </div>
            </div>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-xl font-bold mb-4">
                Create Scheduled Payment
              </h2>
              <form
                onSubmit={handleCreateScheduledPayment}
                className="space-y-6 text-sm"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Vendor (Payee) *
                    </label>
                    <select
                      value={formData.payeeId}
                      onChange={handlePayeeChange}
                      required
                      className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm"
                    >
                      <option value="">-- Select Vendor --</option>
                      {vendors.map((vendor) => (
                        <option key={vendor.id} value={vendor.id}>
                          {vendor.name} ({vendor.currency})
                        </option>
                      ))}
                    </select>
                    {vendors.length === 0 && (
                      <p className="text-[11px] text-amber-600 mt-1">
                        No vendors found for this project. Please add vendors
                        first.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Total Amount *
                    </label>
                    <input
                      type="number"
                      value={formData.total}
                      onChange={handleTotalChange}
                      required
                      min={0}
                      step="0.01"
                      className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Installments and allocations must reconcile to this total.
                    </p>
                  </div>
                </div>

                {/* Installments */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-700 uppercase">
                      Installments
                    </span>
                    <button
                      type="button"
                      onClick={addInstallment}
                      className="px-3 h-8 rounded-md border border-slate-300 text-xs hover:bg-slate-50"
                    >
                      + Add Installment
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.installments.map((inst, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 rounded-lg p-3"
                      >
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Due Date
                          </label>
                          <input
                            type="date"
                            value={inst.dueDate}
                            onChange={(e) =>
                              updateInstallment(
                                index,
                                "dueDate",
                                e.target.value
                              )
                            }
                            required
                            className="w-full h-9 border border-slate-300 rounded-lg px-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Amount
                          </label>
                          <input
                            type="number"
                            value={inst.amount}
                            onChange={(e) =>
                              updateInstallment(
                                index,
                                "amount",
                                Number(e.target.value)
                              )
                            }
                            required
                            min={0}
                            step="0.01"
                            className="w-full h-9 border border-slate-300 rounded-lg px-2 text-sm"
                          />
                        </div>
                        <div className="flex items-end justify-end">
                          {formData.installments.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeInstallment(index)}
                              className="px-3 h-9 rounded-md border border-red-300 text-xs text-red-600 hover:bg-red-50"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Installments Total: $
                    {formatCurrency(
                      formData.installments.reduce(
                        (sum, i) => sum + Number(i.amount),
                        0
                      )
                    )}
                  </div>
                </div>

                {/* Allocations */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-700 uppercase">
                      Budget Allocations
                    </span>
                    <button
                      type="button"
                      onClick={addAllocation}
                      className="px-3 h-8 rounded-md border border-slate-300 text-xs hover:bg-slate-50"
                    >
                      + Add Allocation
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.allocations.map((alloc, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 rounded-lg p-3"
                      >
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Phase
                          </label>
                          <select
                            value={alloc.phase}
                            onChange={(e) =>
                              updateAllocation(index, "phase", e.target.value)
                            }
                            required
                            className="w-full h-9 border border-slate-300 rounded-lg px-2 text-sm"
                          >
                            <option value="DEVELOPMENT">Development</option>
                            <option value="PRODUCTION">Production</option>
                            <option value="POST">Post-Production</option>
                            <option value="PUBLICITY">Publicity</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Amount
                          </label>
                          <input
                            type="number"
                            value={alloc.amount}
                            onChange={(e) =>
                              updateAllocation(
                                index,
                                "amount",
                                Number(e.target.value)
                              )
                            }
                            required
                            min={0}
                            step="0.01"
                            className="w-full h-9 border border-slate-300 rounded-lg px-2 text-sm"
                          />
                        </div>
                        <div className="flex items-end justify-end">
                          {formData.allocations.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeAllocation(index)}
                              className="px-3 h-9 rounded-md border border-red-300 text-xs text-red-600 hover:bg-red-50"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="px-4 h-9 rounded-lg border border-slate-300 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 h-9 rounded-lg bg-blue-600 text-white text-sm font-semibold"
                  >
                    Create Scheduled Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {!selectedProjectId ? (
          <div className="mt-10 text-center p-10 bg-white/80 rounded-2xl border border-slate-200">
            <p className="text-base text-slate-700 mb-2">
              Select a project to view and manage its scheduled payments.
            </p>
          </div>
        ) : (
          <>
            {/* Upcoming banner */}
            <div className="mb-8 p-4 rounded-2xl border border-amber-200 bg-amber-50">
              <h3 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                ⏰ Upcoming Payments (Next 30 Days)
              </h3>
              {getUpcomingInstallments().length === 0 ? (
                <p className="text-sm text-amber-800">
                  No upcoming installments in the next 30 days.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="text-amber-900">
                        <th className="px-2 py-1 text-left">Due Date</th>
                        <th className="px-2 py-1 text-left">Vendor</th>
                        <th className="px-2 py-1 text-right">Amount</th>
                        <th className="px-2 py-1 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getUpcomingInstallments().map((inst) => (
                        <tr key={inst.id} className="border-t border-amber-100">
                          <td className="px-2 py-1">
                            {new Date(inst.dueDate).toLocaleDateString()}
                          </td>
                          <td className="px-2 py-1">{inst.vendor}</td>
                          <td className="px-2 py-1 text-right">
                            ${formatCurrency(inst.amount)}
                          </td>
                          <td className="px-2 py-1">
                            <button
                              type="button"
                              onClick={() =>
                                handleMarkInstallmentPaid(
                                  inst.paymentId,
                                  inst.id,
                                  inst.amount
                                )
                              }
                              className="px-3 h-7 rounded-md border border-emerald-300 text-[11px] text-emerald-700 bg-white hover:bg-emerald-50"
                            >
                              Mark Paid
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* All scheduled payments */}
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              All Scheduled Payments
            </h2>
            {loading ? (
              <p className="text-center text-slate-600 mt-6">Loading...</p>
            ) : scheduledPayments.length === 0 ? (
              <div className="text-center p-10 bg-white/80 rounded-2xl border border-slate-200">
                <p className="text-base text-slate-700 mb-2">
                  No scheduled payments yet.
                </p>
                <p className="text-sm text-slate-500">
                  Create your first scheduled payment to start tracking
                  installments.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {scheduledPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedPayment(
                          expandedPayment === payment.id ? null : payment.id
                        )
                      }
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100"
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 text-sm text-slate-800">
                        <div className="font-semibold">
                          {payment.payee?.name || "Unknown Vendor"}
                        </div>
                        <div className="text-xs text-slate-500">
                          Created:{" "}
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-slate-500">
                          Total: {payment.payee?.currency} $
                          {formatCurrency(payment.total)}
                        </div>
                        <div className="text-xs text-slate-500">
                          Remaining: {payment.payee?.currency} $
                          {formatCurrency(payment.remainingAmount || 0)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-[11px] font-semibold ${
                            payment.status === "Completed"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {payment.status}
                        </span>
                        <span className="text-slate-400 text-xs">
                          {expandedPayment === payment.id ? "▼" : "▶"}
                        </span>
                      </div>
                    </button>

                    {expandedPayment === payment.id && (
                      <div className="px-4 py-3 text-sm">
                        {/* Installments */}
                        <h4 className="font-semibold text-slate-800 mb-2">
                          Installments ({payment.installments.length})
                        </h4>
                        <div className="overflow-x-auto mb-4">
                          <table className="min-w-full text-xs border border-slate-100 rounded-lg overflow-hidden">
                            <thead className="bg-slate-50">
                              <tr>
                                <th className="px-2 py-1 text-left">#</th>
                                <th className="px-2 py-1 text-left">
                                  Due Date
                                </th>
                                <th className="px-2 py-1 text-right">Amount</th>
                                <th className="px-2 py-1 text-left">Status</th>
                                <th className="px-2 py-1 text-left">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {payment.installments.map((inst, index) => (
                                <tr
                                  key={inst.id}
                                  className="border-t border-slate-100"
                                >
                                  <td className="px-2 py-1">{index + 1}</td>
                                  <td className="px-2 py-1">
                                    {new Date(
                                      inst.dueDate
                                    ).toLocaleDateString()}
                                  </td>
                                  <td className="px-2 py-1 text-right">
                                    ${formatCurrency(inst.amount)}
                                  </td>
                                  <td className="px-2 py-1">
                                    <span
                                      className={`inline-flex px-2 py-1 rounded-full text-[11px] font-semibold ${
                                        inst.status === "Paid"
                                          ? "bg-emerald-100 text-emerald-800"
                                          : "bg-amber-100 text-amber-800"
                                      }`}
                                    >
                                      {inst.status}
                                    </span>
                                  </td>
                                  <td className="px-2 py-1">
                                    {inst.status === "Pending" && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleMarkInstallmentPaid(
                                            payment.id,
                                            inst.id,
                                            inst.amount
                                          )
                                        }
                                        className="px-3 h-7 rounded-md border border-emerald-300 text-[11px] text-emerald-700 bg-white hover:bg-emerald-50"
                                      >
                                        Mark Paid
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Allocations */}
                        {payment.allocations &&
                          payment.allocations.length > 0 && (
                            <>
                              <h4 className="font-semibold text-slate-800 mb-2">
                                Budget Allocations
                              </h4>
                              <div className="overflow-x-auto">
                                <table className="min-w-full text-xs border border-slate-100 rounded-lg overflow-hidden">
                                  <thead className="bg-slate-50">
                                    <tr>
                                      <th className="px-2 py-1 text-left">
                                        Phase
                                      </th>
                                      <th className="px-2 py-1 text-right">
                                        Amount
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {payment.allocations.map((alloc) => (
                                      <tr
                                        key={alloc.id}
                                        className="border-t border-slate-100"
                                      >
                                        <td className="px-2 py-1">
                                          {alloc.phase}
                                        </td>
                                        <td className="px-2 py-1 text-right">
                                          ${formatCurrency(alloc.amount)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </>
                          )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
