// apps/web/app/(app)/financing-sources/page.tsx
import { Suspense } from 'react';
import FinancingSourcesContent from './FinancingSourcesContent';
import { FinancingSourcesSkeleton } from '../components/skeletons';

export default function FinancingSourcesPage() {
  return (
    <Suspense fallback={<FinancingSourcesSkeleton />}>
      <FinancingSourcesContent />
    </Suspense>
  );
}
