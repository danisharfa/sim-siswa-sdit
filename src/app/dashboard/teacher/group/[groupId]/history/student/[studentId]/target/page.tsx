import { notFound } from 'next/navigation';
import { getStudentGroupHistory } from '@/lib/data/teacher/weekly-target-history';
import { BackButton } from '@/components/ui/back-button';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { TargetHistoryManagement } from '@/components/teacher/weekly-target/history/TargetHistoryManagement';

type Params = Promise<{ groupId: string; studentId: string }>;

export default async function TargetHistorypage(props: { params: Params }) {
  const params = await props.params;
  const { groupId, studentId } = params;

  const student = await getStudentGroupHistory(groupId, studentId);
  if (!student) return notFound();

  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <BackButton href={`/dashboard/teacher/group/${groupId}/history`} />
        <div className="ml-4">
          <h1 className="text-2xl font-bold">
            Target Mingguan: {student.fullName} ({student.nis})
          </h1>
          <div className="text-sm text-muted-foreground mt-1">
            <span>{student.group?.name || 'Tidak ada kelompok'}</span>
            <span className="mx-2">•</span>
            <span>{student.classroom?.name || 'Tidak ada kelas'}</span>
            <span className="mx-2">•</span>
            <span>
              {student.classroom?.academicYear} - {student.classroom?.semester}
            </span>
          </div>
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-150 w-full" />}>
        <TargetHistoryManagement studentId={student.id} groupId={student.group.id}/>
      </Suspense>
    </div>
  );
}
