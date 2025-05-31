import { notFound } from 'next/navigation';
import { getStudentReportData } from '@/lib/data/teacher/report';
import { StudentReportCard } from '@/components/teacher/report/StudentReportCard';
import { BackButton } from '@/components/ui/back-button';

type Params = Promise<{ groupId: string; studentId: string }>;

export default async function StudentReportPage(props: { params: Params }) {
  const params = await props.params;
  const { groupId, studentId } = params;

  const data = await getStudentReportData(studentId);
  if (!data) return notFound();

  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <BackButton href={`/dashboard/teacher/group/${groupId}`} />
        <h1 className="text-2xl font-bold ml-4">Rapor Al-Qur&apos;an</h1>
      </div>

      <StudentReportCard data={data} />
    </div>
  );
}
