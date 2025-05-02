import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { getGroupById } from '@/lib/data/group';
import { notFound } from 'next/navigation';
import { GroupDetailsManagement } from '@/components/admin/group-members/group-members-management';

export default async function GroupDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;

  const group = await getGroupById(id);

  if (!group) return notFound();

  return (
    <div className="p-4">
      <Link href="/dashboard/admin/group">
        <Button variant="ghost">
          <ArrowLeft />
        </Button>
      </Link>
      <h1 className="text-2xl font-bold mb-4">
        {group.name} - Kelas {group.classroom.name} - {group.classroom.academicYear}
      </h1>

      <GroupDetailsManagement groupId={id} />
    </div>
  );
}
