import { notFound } from 'next/navigation';
import { getStudentReportHistoryData } from '@/lib/data/teacher/report-history';
import { StudentReportHistoryCard } from '@/components/teacher/report/history/StudentReportHistoryCard';
import { BackButton } from '@/components/ui/back-button';

type Params = Promise<{ groupId: string; studentId: string }>;

export default async function StudentReportPage(props: { params: Params }) {
  const params = await props.params;
  const { groupId, studentId } = params;

  // Kirim groupId sebagai parameter kedua untuk mengambil data dari group history
  const data = await getStudentReportHistoryData(studentId, groupId);
  if (!data || data.length === 0) return notFound();

  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <BackButton href={`/dashboard/teacher/group/${groupId}/history`} />
        <h1 className="text-2xl font-bold ml-4">Rapor Al-Qur&apos;an</h1>
      </div>

      <div className="space-y-6">
        {data.map((reportData, index) => (
          <div key={index}>
            <h2 className="text-lg font-semibold mb-2">
              Tahun Ajaran {reportData.academicYear} - Semester {reportData.semester}
            </h2>
            <StudentReportHistoryCard data={reportData} />
          </div>
        ))}
      </div>
    </div>
  );
}
