"use client";

import React, {
  useState,
  useEffect,
  FormEvent,
  ChangeEvent,
  Suspense,
} from "react";
import { useSearchParams } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download } from "lucide-react"; // Optional: for icon

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://film-finance-app.onrender.com/api";

/* ===================== TYPES ===================== */

interface PurchaseOrder {
  id: string;
  docNo: string;
  projectId: string;
  vendorId: string;
  amount: number;
  status: string;
  createdAt: string;
  vendor?: { name: string; currency: string };
  budgetLine?: { name: string; phase: string };
}

interface Project {
  id: string;
  title: string;
}

interface Vendor {
  id: string;
  name: string;
  currency: string;
}

interface BudgetLine {
  id: string;
  name: string;
  phase: string;
  remaining: number;
}

interface POFormData {
  vendorId: string;
  amount: number;
  description: string;
  paymentTerms: string;
  budgetLineId: string;
}

/* ===================== COMPONENT ===================== */

function PurchaseOrdersContent() {
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get("projectId");

  const [projects, setProjects] = useState<Project[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(
    projectIdParam || ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<POFormData>({
    vendorId: "",
    amount: 0,
    description: "",
    paymentTerms: "Net 30 days",
    budgetLineId: "",
  });

  /* ===================== FETCHERS ===================== */

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    fetchVendors(selectedProjectId);
    fetchBudgetLines(selectedProjectId);
    fetchPurchaseOrders(selectedProjectId);
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    const res = await fetch(`${API_BASE_URL}/projects?fetchAll=true`, {
      credentials: "include",
    });
    const json = await res.json();
    if (json.success) setProjects(json.data.projects || []);
  };

  const fetchVendors = async (projectId: string) => {
    const res = await fetch(`${API_BASE_URL}/vendors/project/${projectId}`, {
      credentials: "include",
    });
    const json = await res.json();
    setVendors(json.data?.vendors || []);
  };

  const fetchBudgetLines = async (projectId: string) => {
    if (!projectId) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/${projectId}/budget-lines`,
        { credentials: "include" }
      );

      if (!response.ok) {
        setBudgetLines([]);
        return;
      }

      const result = await response.json();

      if (result.success) {
        const lines = result.data?.lines || result.data?.budgetLines || [];
        setBudgetLines(lines);
      } else {
        setBudgetLines([]);
      }
    } catch (error) {
      console.error("Error fetching budget lines:", error);
      setBudgetLines([]);
    }
  };

  const fetchPurchaseOrders = async (projectId: string) => {
    setLoading(true);
    const res = await fetch(
      `${API_BASE_URL}/projects/${projectId}/purchase-orders`,
      { credentials: "include" }
    );
    const json = await res.json();
    setPurchaseOrders(json.data?.purchaseOrders || []);
    setLoading(false);
  };

  /* ===================== PDF EXPORT ===================== */

  const handleDownloadPDF = () => {
    const doc = new jsPDF("l", "mm", "a4"); // Landscape orientation

    // Get selected project name
    const selectedProject = projects.find((p) => p.id === selectedProjectId);
    const projectTitle = selectedProject?.title || "All Projects";

    // Add header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Purchase Orders Report", 14, 20);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Project: ${projectTitle}`, 14, 28);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 34);

    // Calculate totals
    const totalAmount = purchaseOrders.reduce((sum, po) => sum + po.amount, 0);
    const approvedCount = purchaseOrders.filter(
      (po) => po.status === "Approved"
    ).length;
    const pendingCount = purchaseOrders.filter(
      (po) => po.status === "Pending"
    ).length;
    const rejectedCount = purchaseOrders.filter(
      (po) => po.status === "Rejected"
    ).length;

    // Add summary section
    doc.setFontSize(10);
    doc.text(`Total POs: ${purchaseOrders.length}`, 14, 42);
    doc.text(`Approved: ${approvedCount}`, 60, 42);
    doc.text(`Pending: ${pendingCount}`, 90, 42);
    doc.text(`Rejected: ${rejectedCount}`, 120, 42);
    doc.text(`Total Amount: ${totalAmount.toLocaleString()}`, 150, 42);

    // Prepare table data
    const tableData = purchaseOrders.map((po) => [
      po.docNo || "N/A",
      po.vendor?.name || "N/A",
      `${po.vendor?.currency || ""} ${po.amount.toLocaleString()}`,
      po.budgetLine ? `${po.budgetLine.phase} - ${po.budgetLine.name}` : "N/A",
      po.status,
      new Date(po.createdAt).toLocaleDateString(),
    ]);

    // Add table
    autoTable(doc, {
      head: [
        [
          "PO Number",
          "Vendor",
          "Amount",
          "Budget Line",
          "Status",
          "Created Date",
        ],
      ],
      body: tableData,
      startY: 50,
      theme: "striped",
      headStyles: {
        fillColor: [59, 130, 246], // Blue color
        fontSize: 10,
        fontStyle: "bold",
        halign: "left",
      },
      bodyStyles: {
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 30 }, // PO Number
        1: { cellWidth: 50 }, // Vendor
        2: { cellWidth: 35 }, // Amount
        3: { cellWidth: 60 }, // Budget Line
        4: { cellWidth: 25 }, // Status
        5: { cellWidth: 30 }, // Created Date
      },
      didDrawCell: (data) => {
        // Color code status column
        if (data.column.index === 4 && data.section === "body") {
          const status = data.cell.raw as string;
          if (status === "Approved") {
            doc.setFillColor(220, 252, 231); // Light green
          } else if (status === "Pending") {
            doc.setFillColor(254, 249, 195); // Light yellow
          } else if (status === "Rejected") {
            doc.setFillColor(254, 226, 226); // Light red
          }
        }
      },
      didDrawPage: (data) => {
        // Add page numbers
        const pageCount = doc.getNumberOfPages();
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height || pageSize.getHeight();
        const pageWidth = pageSize.width || pageSize.getWidth();

        doc.setFontSize(8);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
      },
    });

    // Save the PDF
    const fileName = `Purchase_Orders_${projectTitle.replace(/\s+/g, "_")}_${new Date().getTime()}.pdf`;
    doc.save(fileName);
  };

  /* ===================== ACTIONS ===================== */

  const handleCreatePO = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;

    const res = await fetch(
      `${API_BASE_URL}/projects/${selectedProjectId}/purchase-orders`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      }
    );

    const json = await res.json();
    if (!json.success) {
      setError(json.message);
      return;
    }

    setFormData({
      vendorId: "",
      amount: 0,
      description: "",
      paymentTerms: "Net 30 days",
      budgetLineId: "",
    });

    fetchPurchaseOrders(selectedProjectId);
    fetchBudgetLines(selectedProjectId);
  };

  const handleUpdateStatus = async (poId: string, status: string) => {
    if (!selectedProjectId) return;
    if (!confirm(`Change status to ${status}?`)) return;

    const res = await fetch(
      `${API_BASE_URL}/projects/${selectedProjectId}/purchase-orders/${poId}/status`,
      {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }
    );

    const json = await res.json();
    if (!json.success) {
      setError(json.message);
      return;
    }

    fetchPurchaseOrders(selectedProjectId);
    fetchBudgetLines(selectedProjectId);
  };

  const handleDelete = async (poId: string) => {
    if (!selectedProjectId) return;
    if (!confirm("Delete this PO?")) return;

    await fetch(
      `${API_BASE_URL}/projects/${selectedProjectId}/purchase-orders/${poId}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    fetchPurchaseOrders(selectedProjectId);
    fetchBudgetLines(selectedProjectId);
  };

  const handleFormChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((p) => ({
      ...p,
      [name]: name === "amount" ? Number(value) : value,
    }));
  };

  /* ===================== UI ===================== */

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Purchase Orders
            </h1>
            <p className="text-gray-600">
              Manage and track your project purchase orders
            </p>
          </div>

          {/* Download Button */}
          {selectedProjectId && purchaseOrders.length > 0 && (
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex items-center gap-2"
            >
              <Download size={18} />
              Download PDF
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Project Selection */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Project
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="">Select Project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        {/* Create PO Form */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Create Purchase Order
          </h2>
          <form onSubmit={handleCreatePO} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vendor Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendor <span className="text-red-500">*</span>
                </label>
                <select
                  name="vendorId"
                  value={formData.vendorId}
                  onChange={handleFormChange}
                  required
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">Select Vendor</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleFormChange}
                  required
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="0.00"
                />
              </div>

              {/* Budget Line Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget Line
                </label>
                <select
                  name="budgetLineId"
                  value={formData.budgetLineId}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">No Budget Line</option>
                  {budgetLines.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.phase} - {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Enter description"
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full md:w-auto px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Create Purchase Order
              </button>
            </div>
          </form>
        </div>

        {/* Purchase Orders Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Purchase Orders List
            </h2>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PO Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchaseOrders.map((po) => (
                    <tr
                      key={po.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {po.docNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {po.vendor?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {po.vendor?.currency} {po.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            po.status === "Approved"
                              ? "bg-green-100 text-green-800"
                              : po.status === "Rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {po.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          {po.status === "Pending" && (
                            <>
                              <button
                                onClick={() =>
                                  handleUpdateStatus(po.id, "Approved")
                                }
                                className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  handleUpdateStatus(po.id, "Rejected")
                                }
                                className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(po.id)}
                            className="px-3 py-1.5 bg-gray-600 text-white text-xs font-medium rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                          >
                            Delete
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
    </div>
  );
}

/* ===================== PAGE ===================== */

export default function PurchaseOrdersPage() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <PurchaseOrdersContent />
    </Suspense>
  );
}
