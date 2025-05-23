import { notFound } from 'next/navigation';
import { getClassroomById } from '@/lib/data/classroom';
import { ClassroomDetailsManagement } from '@/components/admin/classroom-members/management';
import { PromoteDialogWrapper } from '@/components/admin/classroom-members/promote-dialog-wrapper';
import { BackButton } from '@/components/ui/back-button';

export default async function ClassroomPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;

  const classroom = await getClassroomById(id);

  if (!classroom) return notFound();

  return (
    <div className="p-4">
      <BackButton href={`/dashboard/admin/classroom`} />
      <h1 className="text-2xl font-bold mb-4">
        Kelas {classroom.name} - {classroom.academicYear} {classroom.semester}
      </h1>

      {/* Tombol & Dialog Naik Kelas */}
      <PromoteDialogWrapper
        classroomId={id}
        currentAcademicYear={classroom.academicYear}
        currentSemester={classroom.semester}
      />

      <ClassroomDetailsManagement classroomId={id} />
    </div>
  );
}
