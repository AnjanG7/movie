// app/projects/[id]/page.tsx - Individual project detail page

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { projectsApi, phasesApi } from '../../lib/api';
import { Project, PhaseEntity } from '../../lib/types';
import { ArrowLeft, Calendar, DollarSign, MapPin, Settings, Layers } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [phases, setPhases] = useState<PhaseEntity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [projectRes, phasesRes] = await Promise.all([
          projectsApi.getById(params.id as string),
          phasesApi.getByProject(params.id as string),
        ]);
        setProject(projectRes.data);
        setPhases(phasesRes.data);
      } catch (error) {
        console.error('Error fetching project:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Project not found</h2>
          <Link href="/projects" className="text-blue-600 hover:text-blue-700">
            Return to projects
          </Link>
        </div>
      </div>
    );
  }

  const totalBudget = project.financingSources?.reduce((sum, f) => sum + f.amount, 0) || 0;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/projects"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Created {format(new Date(project.createdAt), 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{project.timezone}</span>
              </div>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
              {project.status}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Budget</p>
          <p className="text-2xl font-bold text-gray-900">
            {project.baseCurrency} {totalBudget.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Layers className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Active Phases</p>
          <p className="text-2xl font-bold text-gray-900">{phases.length}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Financing Sources</p>
          <p className="text-2xl font-bold text-gray-900">
            {project.financingSources?.length || 0}
          </p>
        </div>
      </div>

      {/* Financing Sources */}
      {project.financingSources && project.financingSources.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 mb-8 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Financing Sources</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {project.financingSources.map((source) => (
                <div key={source.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">{source.type}</p>
                    <p className="text-sm text-gray-600">
                      {source.rate && `Rate: ${source.rate}%`}
                      {source.fees && ` • Fees: ${project.baseCurrency} ${source.fees}`}
                    </p>
                  </div>
                  <p className="text-xl font-bold text-green-600">
                    {project.baseCurrency} {source.amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Phases */}
      {phases.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Production Phases</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {phases.map((phase) => (
                <div key={phase.id} className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">
                      {phase.name === 'DEVELOPMENT' && '📝'}
                      {phase.name === 'PRODUCTION' && '🎬'}
                      {phase.name === 'POST' && '✂️'}
                      {phase.name === 'PUBLICITY' && '📢'}
                    </span>
                    {phase.orderNo && (
                      <span className="text-blue-700 text-xs font-semibold">#{phase.orderNo}</span>
                    )}
                  </div>
                  <h4 className="font-bold text-blue-900 mb-1">{phase.name}</h4>
                  <p className="text-xs text-blue-700">Active phase</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}