import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { BackButton } from '@/components/ui/back-button';
import { getGroupHistoryId } from '@/lib/data/coordinator/coordinator-group-member';
import { GroupHistoryManagement } from '@/components/coordinator/group-members/history/GroupHistoryManagement';

type Params = Promise<{ id: string }>;

export default async function CoordinatorGroupHistoryDetailPage({ params }: { params: Params }) {
  const { id } = await params;

  const groupHistory = await getGroupHistoryId(id);
  if (!groupHistory) return notFound();

  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <BackButton href={`/dashboard/coordinator/group`} />
        <div className="ml-4">
          <h1 className="text-2xl font-bold">
            {groupHistory.group.name} - {groupHistory.group.classroom.name}
          </h1>
          <div className="text-sm text-muted-foreground mt-1">
            <span>
              {groupHistory.group.classroom.academicYear} {groupHistory.group.classroom.semester}
            </span>
          </div>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-[100px] w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        }
      >
        <GroupHistoryManagement groupId={id} />
      </Suspense>
    </div>
  );
}
