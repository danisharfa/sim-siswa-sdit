import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { GroupManagement } from '@/components/teacher/group/GroupManagement';

export default function TeacherGroupPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Kelompok Bimbingan</h1>
      <Suspense fallback={<Skeleton className="h-150 w-full" />}>
        <GroupManagement />
      </Suspense>
    </div>
  );
}
