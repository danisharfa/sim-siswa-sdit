import { getGroupById } from '@/lib/data/group';
import { notFound } from 'next/navigation';
import { GroupMembersManagement } from '@/components/coordinator/group-members/GroupMembersManagement';
import { BackButton } from '@/components/ui/back-button';

export default async function GroupDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;

  const group = await getGroupById(id);

  if (!group) return notFound();

  return (
    <div className="p-4">
      <BackButton href={`/dashboard/coordinator/group`} />
      <h1 className="text-2xl font-bold mb-4">
        {group.name} - Kelas {group.classroom.name} {group.classroom.academicYear}{' '}
        {group.classroom.semester}
      </h1>

      <GroupMembersManagement groupId={id} classroomId={group.classroom.id} />
    </div>
  );
}
