import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { BackButton } from '@/components/ui/back-button';
import { getGroupHistoryId } from '@/lib/data/teacher/teacher-group-member';
import { GroupMembersHistoryManagement } from '@/components/teacher/group-members/history/GroupMembersHistoryManagement';

type Params = Promise<{ groupId: string }>;

export default async function GroupHistoryDetailPage({ params }: { params: Params }) {
  const { groupId } = await params;

  const groupHistory = await getGroupHistoryId(groupId);
  if (!groupHistory) return notFound();

  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <BackButton href={`/dashboard/teacher/group`} />
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
        <GroupMembersHistoryManagement groupId={groupId} />
      </Suspense>
    </div>
  );
}
