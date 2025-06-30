import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { TargetManagement } from '@/components/student/submission/target/Management';

export const dynamic = 'force-dynamic';

export default function TargetPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Target</h1>
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        }
      >
        <TargetManagement />
      </Suspense>
    </div>
  );
}
