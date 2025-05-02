import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getClassroomById } from '@/lib/data/classroom';
import { ClassroomDetailsManagement } from '@/components/admin/classroom-members/classroom-members-management';

export default async function ClassroomPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;

  const classroom = await getClassroomById(id);

  if (!classroom) return notFound();

  return (
    <div className="p-4">
      <Link href="/dashboard/admin/classroom">
        <Button variant="ghost">
          <ArrowLeft />
        </Button>
      </Link>
      <h1 className="text-2xl font-bold mb-4">
        Kelas {classroom.name} - {classroom.academicYear}
      </h1>

      <ClassroomDetailsManagement classroomId={id} />
    </div>
  );
}
