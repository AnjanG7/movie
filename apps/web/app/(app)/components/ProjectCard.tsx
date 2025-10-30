// components/ProjectCard.tsx - Project display card

'use client';

import Link from 'next/link';
import { Project } from '../lib/types';
import { Calendar, DollarSign, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface ProjectCardProps {
  project: Project;
}

const statusColors: Record<string, string> = {
  planning: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-700',
  paused: 'bg-yellow-100 text-yellow-700',
};

export default function ProjectCard({ project }: ProjectCardProps) {
  const totalBudget = project.financingSources?.reduce((sum, f) => sum + f.amount, 0) || 0;
  const phaseCount = project.phases?.length || 0;

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer group">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
              {project.title}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(project.createdAt), 'MMM dd, yyyy')}</span>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[project.status || 'planning']}`}>
            {project.status || 'Planning'}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Budget</p>
              <p className="text-sm font-bold text-gray-900">
                {project.baseCurrency} {totalBudget.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MapPin className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Phases</p>
              <p className="text-sm font-bold text-gray-900">{phaseCount} Active</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}