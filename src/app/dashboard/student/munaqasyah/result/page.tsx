import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { MunaqasyahResultManagement } from '@/components/student/munaqasyah/result/MunaqasyahResultManagement';

export const dynamic = 'force-dynamic';

export default function StudentMunaqasyahResultPage() {
  return (
    <div className="p-4">
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        }
      >
        <MunaqasyahResultManagement />
      </Suspense>
    </div>
  );
}
