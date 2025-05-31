import { notFound } from 'next/navigation';
import { getStudentForTeacherGroup } from '@/lib/data/teacher/teacher-group-member';
import { ScoreForm } from '@/components/teacher/report/score/ScoreForm';
import { BackButton } from '@/components/ui/back-button';

type Params = Promise<{ groupId: string; studentId: string }>;

export default async function ScorePage(props: { params: Params }) {
  const params = await props.params;
  const { groupId, studentId } = params;

  const student = await getStudentForTeacherGroup(groupId, studentId);
  if (!student) return notFound();

  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <BackButton href={`/dashboard/teacher/group/${groupId}`} />
        <h1 className="text-2xl font-bold ml-4">
          Penilaian: {student.fullName} ({student.nis})
        </h1>
      </div>

      <ScoreForm groupId={groupId} student={student} />
    </div>
  );
}
