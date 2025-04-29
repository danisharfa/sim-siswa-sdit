import { ClassroomDetailsManagement } from '@/components/admin/classroom-members/classroom-members-management';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { getClassroomById } from '@/lib/datas/classroom';
import { notFound } from 'next/navigation';

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
        Kelas {classroom.namaKelas} - {classroom.tahunAjaran}
      </h1>

      <ClassroomDetailsManagement kelasId={id} />
    </div>
  );
}
