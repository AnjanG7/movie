// apps/web/app/app/quotations/page.tsx
'use client';

import React, { Suspense } from 'react';
import QuotationsContent from './QuotationsContent';

function QuotationsFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="flex flex-col items-center gap-3 text-slate-600">
        <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Loading quotations…</p>
      </div>
    </div>
  );
}

export default function QuotationsPage() {
  return (
    <Suspense fallback={<QuotationsFallback />}>
      <QuotationsContent />
    </Suspense>
  );
}
