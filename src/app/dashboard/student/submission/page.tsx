import { requireStudentRole } from '@/lib/auth/require-role';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { SubmissionManagement } from '@/components/student/submission/SubmissionManagement';

export const dynamic = 'force-dynamic';

export default async function StudentSubmissionHistoryPage() {
  const user = await requireStudentRole();

  return (
    <div className="p-4">
      <div className="flex items-baseline gap-2 mb-4">
        <h1 className="text-2xl font-bold">Setoran</h1>
        <span className="text-muted-foreground">{user.profile?.nis}</span>
      </div>
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
