import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { SubmissionManagement } from '@/components/student/submission/SubmissionManagement';

export default function StudentSubmissionHistoryPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Riwayat Setoran</h1>
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        }
      >
        <SubmissionManagement />
      </Suspense>
    </div>
  );
}
