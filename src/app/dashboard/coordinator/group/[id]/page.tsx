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
      <div className="flex items-center mb-4">
        <BackButton href={`/dashboard/coordinator/group`} />
        <div className="ml-4">
          <h1 className="text-2xl font-bold">
            {group.name} - {group.classroom.name}
          </h1>
          <div className="text-sm text-muted-foreground mt-1">
            <span>
              {group.classroom.academicYear} {group.classroom.semester}
            </span>
          </div>
        </div>
      </div>

      <GroupMembersManagement groupId={id} classroomId={group.classroom.id} />
    </div>
  );
}
