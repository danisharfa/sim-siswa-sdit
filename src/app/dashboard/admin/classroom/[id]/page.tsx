import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

import { ClassroomDetails } from '@/components/classroom-details/classroom-details';
import { getClassroomById } from '@/lib/data';
import { AddMemberForm } from '@/components/classroom-details/add-member-form';

type Params = Promise<{ id: string }>;

export default async function ClassroomPage(props: { params: Params }) {
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
      <AddMemberForm kelasId={id} />

      <ClassroomDetails kelasId={id} />
    </div>
  );
}
