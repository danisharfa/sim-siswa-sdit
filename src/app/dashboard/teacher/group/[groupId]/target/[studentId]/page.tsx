import { notFound } from 'next/navigation';
import { BackButton } from '@/components/ui/back-button';
import { getStudentForTeacherGroup } from '@/lib/data/teacher/teacher-group-member';
import { TargetManagement } from '@/components/teacher/weekly-target/management';

type Params = Promise<{ groupId: string; studentId: string }>;

export default async function SubmissionTargetPage({ params }: { params: Params }) {
  const { groupId, studentId } = await params;

  const student = await getStudentForTeacherGroup(groupId, studentId);
  if (!student) return notFound();

  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <BackButton href={`/dashboard/teacher/group/${groupId}`} />
        <h1 className="text-2xl font-bold ml-4">
          Target Mingguan: {student.fullName} ({student.nis})
        </h1>
      </div>

      <TargetManagement student={student} />
    </div>
  );
}
