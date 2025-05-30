import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { StudentTashihScheduleManagement } from '@/components/student/tashih/schedule/management';

export default function StudentTashihSchedulePage() {
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
        <StudentTashihScheduleManagement />
      </Suspense>
    </div>
  );
}
