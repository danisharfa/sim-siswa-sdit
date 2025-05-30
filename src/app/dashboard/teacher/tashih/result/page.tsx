import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { TeacherTashihResultManagement } from '@/components/teacher/tashih/result/management';

export default function TeacherTashihFormPage() {
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
        <TeacherTashihResultManagement />
      </Suspense>
    </div>
  );
}
