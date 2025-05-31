import { notFound } from 'next/navigation';
import { BackButton } from '@/components/ui/back-button';
import { getStudentForTeacherGroupHistory } from '@/lib/data/teacher/teacher-group-member';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { TargetHistoryManagement } from '@/components/teacher/weekly-target/history/TargetHistoryManagement';

type Params = Promise<{ groupId: string; studentId: string }>;

export default async function TargetHistoryPage({ params }: { params: Params }) {
  const { groupId, studentId } = await params;

  console.log('Group ID:', groupId);
  console.log('Student ID:', studentId);

  const student = await getStudentForTeacherGroupHistory(groupId, studentId);
  if (!student) return notFound();

  const getAcademicInfo = () => {
    if (!student.classroom) return '';

    const { academicYear, semester } = student.classroom;
    const semesterText = semester === 'GANJIL' ? 'Ganjil' : 'Genap';
    return `${academicYear} - Semester ${semesterText}`;
  };

  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <BackButton href={`/dashboard/teacher/group/${groupId}/history`} />
        <div className="ml-4">
          <h1 className="text-2xl font-bold">
            Riwayat Target: {student.fullName} ({student.nis})
          </h1>
          <div className="text-sm text-muted-foreground mt-1">
            <span>{student.group?.name || 'Tidak ada kelompok'}</span>
            <span className="mx-2">•</span>
            <span>{student.classroom?.name || 'Tidak ada kelas'}</span>
            <span className="mx-2">•</span>
            <span>{getAcademicInfo() || 'Periode tidak diketahui'}</span>
          </div>
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-150 w-full" />}>
        <TargetHistoryManagement studentId={student.id} />
      </Suspense>
    </div>
  );
}
