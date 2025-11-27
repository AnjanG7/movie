'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Clock,
  Film,
  Edit,
  MoreVertical,
  AlertCircle,
  FileText,
  ShoppingCart,
  Wallet,
  TrendingUp,
  Users,
  Package,
  Megaphone, // ✅ ADD THIS IMPORT
} from 'lucide-react';
import { Project } from '../../lib/types';

const API_BASE_URL = 'http://localhost:4000/api';

export default function ProjectProfilePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Fetch project details
  const fetchProject = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        const projectData: Project = {
          id: result.data.id,
          title: result.data.title,
          baseCurrency: result.data.baseCurrency,
          timezone: result.data.timezone,
          status: result.data.status,
          ownerId: result.data.ownerId,
          createdAt: result.data.createdAt,
          phases: result.data.phases || [],
          financingSources: result.data.financingSources || [],
        };
        setProject(projectData);
      } else {
        throw new Error(result.message || 'Failed to fetch project');
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      setError(error instanceof Error ? error.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'paused':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-8">
        <button
          onClick={() => router.push('/projects')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Projects
        </button>
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Error Loading Project
          </h3>
          <p className="text-red-700">{error || 'Project not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/projects')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Projects
        </button>

        {/* Project Header Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Film className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {project.title}
                </h1>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                      project.status || 'planning'
                    )}`}
                  >
                    {(project.status || 'planning').charAt(0).toUpperCase() +
                      (project.status || 'planning').slice(1)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Edit className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Key Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Base Currency</p>
                <p className="text-lg font-semibold text-gray-900">
                  {project.baseCurrency}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Timezone</p>
                <p className="text-lg font-semibold text-gray-900">
                  {project.timezone}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Created</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDate(project.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Quotations */}
          <Link
            href={`/projects/${projectId}/quotations`}
            className="group p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg hover:border-blue-400 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Quotations</h3>
                <p className="text-sm text-gray-600">Manage investor quotes</p>
              </div>
            </div>
          </Link>

          {/* Budget */}
          <Link
            href={`/projects/${projectId}/budget`}
            className="group p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg hover:border-green-400 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Budget</h3>
                <p className="text-sm text-gray-600">Track expenses</p>
              </div>
            </div>
          </Link>

          {/* Purchase Orders */}
          <Link
            href={`/projects/${projectId}/purchase-orders`}
            className="group p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg hover:border-orange-400 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                <ShoppingCart className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Purchase Orders
                </h3>
                <p className="text-sm text-gray-600">Vendor orders</p>
              </div>
            </div>
          </Link>

          {/* Cashflow */}
          <Link
            href={`/projects/${projectId}/cashflow`}
            className="group p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg hover:border-teal-400 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-teal-100 rounded-lg group-hover:bg-teal-200 transition-colors">
                <Wallet className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Cashflow</h3>
                <p className="text-sm text-gray-600">Manage finances</p>
              </div>
            </div>
          </Link>

          {/* Post Production */}
          <Link
            href={`/projects/${projectId}/post-production`}
            className="group p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg hover:border-purple-400 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Post Production
                </h3>
                <p className="text-sm text-gray-600">VFX, Sound, Editing</p>
              </div>
            </div>
          </Link>

          {/* ✅ PUBLICITY & P&A - NEW CARD */}
          <Link
            href={`/projects/${projectId}/publicity`}
            className="group p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg hover:border-pink-400 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-pink-100 rounded-lg group-hover:bg-pink-200 transition-colors">
                <Megaphone className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Publicity & P&A
                </h3>
                <p className="text-sm text-gray-600">Marketing campaigns</p>
              </div>
            </div>
          </Link>

          {/* Waterfall */}
          <Link
            href={`/projects/${projectId}/waterfall`}
            className="group p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg hover:border-indigo-400 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Waterfall</h3>
                <p className="text-sm text-gray-600">Investor distributions</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Additional Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Phases */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Production Phases
          </h2>
          {project.phases && project.phases.length > 0 ? (
            <div className="space-y-2">
              {project.phases.map((phase, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900">{phase.name}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">No phases added yet</p>
          )}
        </div>

        {/* Financing Sources */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Financing Sources
          </h2>
          {project.financingSources && project.financingSources.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {project.financingSources.map((source, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900">
                      {source.type}
                    </p>
                    <p className="text-lg font-bold text-green-600">
                      {project.baseCurrency}{' '}
                      {source.amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  {source.rate && (
                    <p className="text-xs text-gray-600">Rate: {source.rate}%</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">
              No financing sources added yet
            </p>
          )}
        </div>
      </div>

      {/* Last Updated */}
      <div className="mt-6 text-center text-sm text-gray-500">
        Last updated: {formatDate(project.createdAt)}
      </div>
    </div>
  );
}
