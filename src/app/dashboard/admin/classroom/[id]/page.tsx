import { notFound } from 'next/navigation';
import { getClassroomById } from '@/lib/data/classroom';
import { ClassroomMembersManagement } from '@/components/admin/classroom-members/ClassroomMembersManagement';
import { PromoteSemesterButton } from '@/components/admin/classroom-members/PromoteSemesterButton';
import { BackButton } from '@/components/ui/back-button';

type Params = Promise<{ id: string }>;

export default async function ClassroomPage({ params }: { params: Params }) {
  const { id } = await params;

  const classroom = await getClassroomById(id);
  if (!classroom) return notFound();

  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <BackButton href={`/dashboard/admin/classroom`} />
        <h1 className="text-2xl font-bold ml-4">
          Kelas {classroom.name} - {classroom.academicYear} {classroom.semester}
        </h1>
      </div>

      {/* Tombol & Dialog Naik Kelas */}
      <PromoteSemesterButton
        classroomId={id}
        currentAcademicYear={classroom.academicYear}
        currentSemester={classroom.semester}
      />

      <ClassroomMembersManagement classroomId={id} />
    </div>
  );
}
