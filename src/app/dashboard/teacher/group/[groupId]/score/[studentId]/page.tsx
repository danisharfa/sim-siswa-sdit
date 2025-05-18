import { notFound } from 'next/navigation';
import { getStudentForTeacherGroup } from '@/lib/data/teacher/teacher-group-member';
import { ScoreInputForm } from '@/components/teacher/score/score-form';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default async function ScorePage(props: {
  params: Promise<{ groupId: string; studentId: string }>;
}) {
  const params = await props.params;
  const { groupId, studentId } = params;

  const student = await getStudentForTeacherGroup(groupId, studentId);
  if (!student) return notFound();

  return (
    <div className="p-4">
      <Button asChild variant="ghost" size="icon">
        <Link href={`/dashboard/teacher/group/${groupId}`}>
          <ArrowLeft />
        </Link>
      </Button>

      <h1 className="text-2xl font-bold">
        Penilaian - {student.fullName} ({student.nis})
      </h1>
      <ScoreInputForm groupId={groupId} student={student} />
    </div>
  );
}
