'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Download,
  Lock,
  CheckCircle,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import { getQuotations, deleteQuotation } from '../../../lib/api/quotation';
import type { Quotation } from '../../../lib/types/quotation';

// API base URLs
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const FILE_BASE_URL = 'http://localhost:4000'; // where /exports is served

// Local helpers
function formatDate(value: string | Date) {
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString();
}

function formatCurrency(amount: number, currency: string = 'USD') {
  if (amount == null || Number.isNaN(amount)) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function QuotationsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      fetchQuotations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const response = await getQuotations(projectId);
      if (response.success) {
        setQuotations(response.data || []);
      } else {
        throw new Error(response.message || 'Failed to fetch quotations');
      }
    } catch (err: any) {
      console.error('Error fetching quotations:', err);
      setError(err.message || 'Failed to fetch quotations');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (versionId: string) => {
    if (!confirm('Are you sure you want to delete this quotation?')) return;

    try {
      const response = await deleteQuotation(projectId, versionId);
      if (response.success) {
        alert('Quotation deleted successfully!');
        fetchQuotations();
      } else {
        throw new Error(response.message || 'Failed to delete quotation');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete quotation');
    }
  };

  const handleDownloadQuotationPdf = async (quotationId: string) => {
    try {
      // 1) Ask API to generate the PDF
      const res = await fetch(
        `${API_BASE_URL}/projects/${projectId}/quotations/${quotationId}/export/pdf`,
        { credentials: 'include' }
      );
      if (!res.ok) throw new Error(`Export failed: ${res.status}`);

      const json = await res.json();
      if (!json.success || !json.data?.url) {
        throw new Error(json.message || 'Export response invalid');
      }

      const fileUrl = `${FILE_BASE_URL}${json.data.url}`; // e.g. http://localhost:4000/exports/...
      const filename = json.data.filename || `quotation-${quotationId}.pdf`;

      // 2) Download the actual PDF from /exports
      const fileRes = await fetch(fileUrl, { credentials: 'include' });
      if (!fileRes.ok) throw new Error(`File download failed: ${fileRes.status}`);

      const blob = await fileRes.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
    } catch (err: any) {
      console.error('Download error', err);
      alert(err.message || 'Failed to download PDF');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'QUOTE':
        return 'bg-blue-100 text-blue-800';
      case 'BASELINE':
        return 'bg-green-100 text-green-800';
      case 'WORKING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
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
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Investor Quotations</h1>
            </div>
            <p className="text-gray-600">
              Create and manage investor quotations with ROI projections
            </p>
          </div>
          <button
            onClick={() => router.push(`/projects/${projectId}/quotations/new`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Quotation
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {quotations.length === 0 && !error && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Quotations Yet</h3>
          <p className="text-gray-600 mb-4">
            Create your first investor quotation with cost breakdown and ROI projections
          </p>
          <button
            onClick={() => router.push(`/projects/${projectId}/quotations/new`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Quotation
          </button>
        </div>
      )}

      {/* Quotations List */}
      {quotations.length > 0 && (
        <div className="space-y-4">
          {quotations.map((quotation) => (
            <div
              key={quotation.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">
                      {quotation.version}
                    </h3>
                    <span
                      className={`text-xs px-2 py-1 rounded font-medium ${getTypeColor(
                        quotation.type
                      )}`}
                    >
                      {quotation.type}
                    </span>
                    {quotation.lockedAt && (
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Locked
                      </span>
                    )}
                    {quotation.acceptedAt && (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Accepted
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    Created {formatDate(quotation.createdAt)}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/projects/${projectId}/quotations/${quotation.id}`}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View"
                  >
                    <Eye className="w-5 h-5" />
                  </Link>
                  {!quotation.lockedAt && (
                    <>
                      <Link
                        href={`/projects/${projectId}/quotations/${quotation.id}/edit`}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(quotation.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDownloadQuotationPdf(quotation.id)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Download PDF"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Cost</p>
                  <p className="text-lg font-bold text-gray-900">
                    {quotation.grandTotal
                      ? formatCurrency(
                          quotation.grandTotal,
                          quotation.assumptions?.currency || 'USD'
                        )
                      : '-'}
                  </p>
                </div>
                {quotation.metrics && (
                  <>
                    <div>
                      <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        ROI
                      </p>
                      <p className="text-lg font-bold text-green-600">
                        {quotation.metrics.roi.toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">IRR</p>
                      <p className="text-lg font-bold text-blue-600">
                        {quotation.metrics.irr.toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        Projected Profit
                      </p>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(
                          quotation.metrics.profit,
                          quotation.assumptions?.currency || 'USD'
                        )}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
