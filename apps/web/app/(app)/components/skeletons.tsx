// apps/web/components/skeletons.tsx
export function FinancingSourcesSkeleton() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-300 rounded w-1/3"></div>
        <div className="h-6 bg-gray-300 rounded w-full"></div>
        <div className="h-6 bg-gray-300 rounded w-full"></div>
        <div className="h-6 bg-gray-300 rounded w-1/2"></div>
      </div>
    </div>
  );
}
