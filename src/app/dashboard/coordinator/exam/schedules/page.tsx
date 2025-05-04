import { ExamScheduleManagement } from '@/components/coordinator/exam/schedule/management';

export default function CoordinatorExamSchedulePage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Manajemen Jadwal Ujian</h1>
      <ExamScheduleManagement />
    </div>
  );
}
