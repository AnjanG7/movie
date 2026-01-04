// components/StatsCard.tsx - Metric display cards

"use client";

import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
}

export default function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor = "text-blue-600",
  iconBg = "bg-blue-100",
}: StatsCardProps) {
  const isPositive = typeof change === "number" && change > 0;
  const isNegative = typeof change === "number" && change < 0;

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow h-full flex flex-col">
      {/* Top content */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>

        <div className={`${iconBg} p-3 rounded-lg shrink-0`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>

      {/* Bottom content (forces equal height) */}
      {change !== undefined && (
        <div className="mt-auto pt-4">
          <div className="flex items-center gap-1">
            {isPositive && <TrendingUp className="w-4 h-4 text-green-600" />}
            {isNegative && <TrendingDown className="w-4 h-4 text-red-600" />}
            <span
              className={`text-sm font-medium ${
                isPositive
                  ? "text-green-600"
                  : isNegative
                    ? "text-red-600"
                    : "text-gray-600"
              }`}
            >
              {isPositive && "+"}
              {change}%
            </span>
            <span className="text-sm text-gray-500">vs last month</span>
          </div>
        </div>
      )}
    </div>
  );
}
