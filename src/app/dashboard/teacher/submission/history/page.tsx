import { Suspense } from 'react';
import { SubmissionHistoryManagement } from '@/components/teacher/submission/history/management';
import { Skeleton } from '@/components/ui/skeleton';

export default function SubmissionHistoryPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Riwayat Setoran</h1>
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        }
      >
        <SubmissionHistoryManagement />
      </Suspense>
    </div>
  );
}
