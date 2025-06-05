import { notFound } from 'next/navigation';
import { getStudent } from '@/lib/data/teacher/teacher-group-member';
import { BackButton } from '@/components/ui/back-button';
import { ScoreForm } from '@/components/teacher/report/score/ScoreForm';

type Params = Promise<{ groupId: string; studentId: string }>;

export default async function ScorePage(props: { params: Params }) {
  const params = await props.params;
  const { groupId, studentId } = params;

  const student = await getStudent(groupId, studentId);
  if (!student) return notFound();

  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <BackButton href={`/dashboard/teacher/group/${groupId}`} />
        <div className="ml-4">
          <h1 className="text-2xl font-bold">
            Penilaian: {student.user.fullName} ({student.nis})
          </h1>
          <div className="text-sm text-muted-foreground mt-1">
            <span>{student.group?.name || 'Tidak ada kelompok'}</span>
            <span className="mx-2">•</span>
            <span>{student.group?.classroom?.name || 'Tidak ada kelas'}</span>
            <span className="mx-2">•</span>
            <span>
              {student.group?.classroom?.academicYear} - {student.group?.classroom?.semester}
            </span>
          </div>
        </div>
      </div>

      <ScoreForm groupId={groupId} student={student} />
    </div>
  );
}
