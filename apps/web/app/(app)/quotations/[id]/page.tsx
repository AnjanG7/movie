"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";

const API_BASE_URL = "https://movie-finance.onrender.com/api";

interface Quotation {
  id: string;
  version: string;
  projectId: string;
  template?: string;
  assumptions?: {
    currency?: string;
    taxPercent?: number;
    contingencyPercent?: number;
    insurancePercent?: number;
    bondPercent?: number;
  };
  financingPlan?: {
    sources: Array<{
      type: string;
      amount: number;
      rate: number;
    }>;
  };
  revenueModel?: {
    grossRevenue: number;
    distributionFeePercent: number;
  };
  metrics?: {
    totalCost: number;
    projectedRevenue: number;
    roi: number;
    irr: number;
    npv: number;
    profit: number;
  };
  lines: CostLine[];
  summary?: {
    subtotal: number;
    contingency: number;
    insurance: number;
    bond: number;
    total: number;
    totalsByPhase: Record<string, number>;
  };
  project?: {
    title: string;
    baseCurrency: string;
  };
  createdAt: string;
}

interface CostLine {
  id: string;
  phase: string;
  department: string | null;
  name: string;
  qty: number;
  rate: number;
  taxPercent: number;
}

export default function QuotationViewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const quotationId = params.id as string;
  const projectId = searchParams.get("projectId") || "";

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (quotationId) {
      fetchQuotation();
    }
  }, [quotationId]);

  const fetchQuotation = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/${projectId}/quotations/${quotationId}`,
        { credentials: "include" }
      );
      const result = await response.json();
      if (result.success) {
        setQuotation(result.data);
      }
    } catch (error) {
      console.error("Error fetching quotation:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    const currency = quotation?.project?.baseCurrency || "USD";
    return `${currency} ${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div style={{ padding: "20px" }}>Loading...</div>;
  }

  if (!quotation) {
    return <div style={{ padding: "20px" }}>Quotation not found</div>;
  }

  const assumptions = quotation.assumptions || {};

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          marginBottom: "40px",
          borderBottom: "2px solid #4472C4",
          paddingBottom: "20px",
        }}
      >
        <h1 style={{ margin: "0 0 10px 0", color: "#4472C4" }}>
          INVESTOR QUOTATION
        </h1>
        <h2 style={{ margin: "0 0 10px 0" }}>
          {quotation.project?.title || "Untitled Project"}
        </h2>
        <p style={{ color: "#666", margin: 0 }}>
          Version: {quotation.version} | Template: {quotation.template || "N/A"}{" "}
          | Created: {new Date(quotation.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Print Button */}
      <div style={{ marginBottom: "20px" }} className="no-print">
        <button
          onClick={handlePrint}
          style={{ padding: "10px 20px", cursor: "pointer" }}
        >
          🖨️ Print / Save as PDF
        </button>
      </div>

      {/* Assumptions */}
      <div style={{ marginBottom: "40px" }}>
        <h3 style={{ borderBottom: "1px solid #ddd", paddingBottom: "10px" }}>
          Budget Assumptions
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "20px",
            marginTop: "20px",
          }}
        >
          <div>
            <strong>Currency:</strong> {assumptions.currency || "USD"}
          </div>
          <div>
            <strong>Tax:</strong> {assumptions.taxPercent || 0}%
          </div>
          <div>
            <strong>Contingency:</strong> {assumptions.contingencyPercent || 0}%
          </div>
          <div>
            <strong>Insurance:</strong> {assumptions.insurancePercent || 0}%
          </div>
          <div>
            <strong>Bond:</strong> {assumptions.bondPercent || 0}%
          </div>
        </div>
      </div>

      {/* Cost Breakdown by Phase */}
      <div style={{ marginBottom: "40px" }}>
        <h3 style={{ borderBottom: "1px solid #ddd", paddingBottom: "10px" }}>
          Cost Breakdown
        </h3>

        {quotation.summary?.totalsByPhase && (
          <div style={{ marginTop: "20px", marginBottom: "30px" }}>
            <table
              border={1}
              cellPadding={10}
              style={{ width: "100%", borderCollapse: "collapse" }}
            >
              <thead style={{ backgroundColor: "#4472C4", color: "white" }}>
                <tr>
                  <th>Phase</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                  <th style={{ textAlign: "right" }}>% of Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(quotation.summary.totalsByPhase).map(
                  ([phase, amount]) => (
                    <tr key={phase}>
                      <td>
                        <strong>{phase}</strong>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {formatCurrency(amount as number)}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {quotation.summary && quotation.summary.subtotal > 0
                          ? (
                              ((amount as number) /
                                quotation.summary.subtotal) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Detailed Line Items */}
        {quotation.lines.length > 0 && (
          <table
            border={1}
            cellPadding={8}
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "12px",
            }}
          >
            <thead style={{ backgroundColor: "#f5f5f5" }}>
              <tr>
                <th>Phase</th>
                <th>Department</th>
                <th>Line Item</th>
                <th style={{ textAlign: "right" }}>Qty</th>
                <th style={{ textAlign: "right" }}>Rate</th>
                <th style={{ textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {quotation.lines.map((line) => {
                const lineTotal =
                  line.qty * line.rate * (1 + line.taxPercent / 100);
                return (
                  <tr key={line.id}>
                    <td>{line.phase}</td>
                    <td>{line.department || "-"}</td>
                    <td>{line.name}</td>
                    <td style={{ textAlign: "right" }}>{line.qty}</td>
                    <td style={{ textAlign: "right" }}>
                      {line.rate.toLocaleString()}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {formatCurrency(lineTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary */}
      {quotation.summary && (
        <div
          style={{
            marginBottom: "40px",
            border: "2px solid #4472C4",
            padding: "20px",
            borderRadius: "8px",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Budget Summary</h3>
          <table style={{ width: "100%", fontSize: "14px" }}>
            <tbody>
              <tr>
                <td style={{ padding: "8px 0" }}>Subtotal:</td>
                <td style={{ textAlign: "right", padding: "8px 0" }}>
                  {formatCurrency(quotation.summary.subtotal)}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px 0" }}>
                  Contingency ({assumptions.contingencyPercent || 0}%):
                </td>
                <td style={{ textAlign: "right", padding: "8px 0" }}>
                  {formatCurrency(quotation.summary.contingency)}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px 0" }}>
                  Insurance ({assumptions.insurancePercent || 0}%):
                </td>
                <td style={{ textAlign: "right", padding: "8px 0" }}>
                  {formatCurrency(quotation.summary.insurance)}
                </td>
              </tr>
              <tr style={{ borderBottom: "2px solid #ddd" }}>
                <td style={{ padding: "8px 0" }}>
                  Bond ({assumptions.bondPercent || 0}%):
                </td>
                <td style={{ textAlign: "right", padding: "8px 0" }}>
                  {formatCurrency(quotation.summary.bond)}
                </td>
              </tr>
              <tr style={{ fontSize: "18px", fontWeight: "bold" }}>
                <td style={{ padding: "15px 0 0 0" }}>TOTAL BUDGET:</td>
                <td
                  style={{
                    textAlign: "right",
                    padding: "15px 0 0 0",
                    color: "#4472C4",
                  }}
                >
                  {formatCurrency(quotation.summary.total)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Financing Plan */}
      {quotation.financingPlan?.sources &&
        quotation.financingPlan.sources.length > 0 && (
          <div style={{ marginBottom: "40px" }}>
            <h3
              style={{ borderBottom: "1px solid #ddd", paddingBottom: "10px" }}
            >
              Financing Plan
            </h3>
            <table
              border={1}
              cellPadding={10}
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: "20px",
              }}
            >
              <thead style={{ backgroundColor: "#f5f5f5" }}>
                <tr>
                  <th>Type</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                  <th style={{ textAlign: "right" }}>Rate</th>
                </tr>
              </thead>
              <tbody>
                {quotation.financingPlan.sources.map((source, index) => (
                  <tr key={index}>
                    <td>{source.type}</td>
                    <td style={{ textAlign: "right" }}>
                      {formatCurrency(source.amount)}
                    </td>
                    <td style={{ textAlign: "right" }}>{source.rate || 0}%</td>
                  </tr>
                ))}
              </tbody>
              <tfoot style={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
                <tr>
                  <td>Total Financing</td>
                  <td style={{ textAlign: "right" }} colSpan={2}>
                    {formatCurrency(
                      quotation.financingPlan.sources.reduce(
                        (sum, s) => sum + s.amount,
                        0
                      )
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

      {/* Financial Metrics */}
      {quotation.metrics && (
        <div style={{ marginBottom: "40px" }}>
          <h3 style={{ borderBottom: "1px solid #ddd", paddingBottom: "10px" }}>
            Financial Projections
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "20px",
              marginTop: "20px",
            }}
          >
            <div
              style={{
                border: "1px solid #ddd",
                padding: "15px",
                borderRadius: "8px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#666",
                  marginBottom: "10px",
                }}
              >
                Return on Investment
              </div>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: quotation.metrics.roi >= 0 ? "#22c55e" : "#ef4444",
                }}
              >
                {quotation.metrics.roi.toFixed(2)}%
              </div>
            </div>
            <div
              style={{
                border: "1px solid #ddd",
                padding: "15px",
                borderRadius: "8px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#666",
                  marginBottom: "10px",
                }}
              >
                Internal Rate of Return
              </div>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: "#4472C4",
                }}
              >
                {quotation.metrics.irr.toFixed(2)}%
              </div>
            </div>
            <div
              style={{
                border: "1px solid #ddd",
                padding: "15px",
                borderRadius: "8px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#666",
                  marginBottom: "10px",
                }}
              >
                Net Present Value
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: quotation.metrics.npv >= 0 ? "#22c55e" : "#ef4444",
                }}
              >
                {formatCurrency(quotation.metrics.npv)}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "20px",
              marginTop: "20px",
            }}
          >
            <div
              style={{
                border: "1px solid #ddd",
                padding: "15px",
                borderRadius: "8px",
              }}
            >
              <div
                style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}
              >
                Total Cost
              </div>
              <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                {formatCurrency(quotation.metrics.totalCost)}
              </div>
            </div>
            <div
              style={{
                border: "1px solid #ddd",
                padding: "15px",
                borderRadius: "8px",
              }}
            >
              <div
                style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}
              >
                Projected Revenue
              </div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "#22c55e",
                }}
              >
                {formatCurrency(quotation.metrics.projectedRevenue)}
              </div>
            </div>
            <div
              style={{
                border: "1px solid #ddd",
                padding: "15px",
                borderRadius: "8px",
              }}
            >
              <div
                style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}
              >
                Projected Profit
              </div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: quotation.metrics.profit >= 0 ? "#22c55e" : "#ef4444",
                }}
              >
                {formatCurrency(quotation.metrics.profit)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          marginTop: "60px",
          paddingTop: "20px",
          borderTop: "1px solid #ddd",
          fontSize: "12px",
          color: "#666",
          textAlign: "center",
        }}
      >
        <p>This quotation is valid for 30 days from the date of issue.</p>
        <p>All figures are estimates and subject to final negotiation.</p>
        <p>
          © {new Date().getFullYear()}{" "}
          {quotation.project?.title || "Film Finance App"}. All rights reserved.
        </p>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            margin: 0;
            padding: 20px;
          }
          @page {
            margin: 2cm;
          }
          table {
            page-break-inside: avoid;
          }
          h1,
          h2,
          h3 {
            page-break-after: avoid;
          }
        }
      `}</style>
    </div>
  );
}
