import Link from 'next/link';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { getGroupId } from '@/lib/data/teacher/teacher-group-member';
import { GroupDetailsManagement } from '@/components/teacher/group-members/management';

export default async function GroupDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;

  const group = await getGroupId(id);

  if (!group) return notFound();

  return (
    <div className="p-4">
      <Link href="/dashboard/teacher/group">
        <Button variant="ghost">
          <ArrowLeft />
        </Button>
      </Link>

      <h1 className="text-2xl font-bold mb-4">
        {group.name} - Kelas {group.classroom.name} {group.classroom.academicYear}{' '}
        {group.classroom.semester}
      </h1>

      <Suspense
        fallback={
          <div className="space-y-6">
            <Skeleton className="h-[100px] w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        }
      >
        <GroupDetailsManagement groupId={id} />
      </Suspense>
    </div>
  );
}
