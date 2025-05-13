import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { getGroupByIdForTeacher } from '@/lib/data/group';
import { notFound } from 'next/navigation';
import { GroupDetailsManagement } from '@/components/teacher/group-members/group-members-management';

export default async function GroupDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;

  const group = await getGroupByIdForTeacher(id);

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

      <GroupDetailsManagement groupId={id} />
    </div>
  );
}
