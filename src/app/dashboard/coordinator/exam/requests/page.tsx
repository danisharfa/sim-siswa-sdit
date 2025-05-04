import { ExamRequestManagement } from '@/components/coordinator/exam/request/management';

export default function CoordinatorExamRequestsPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Daftar Ujian Siswa</h1>
      <ExamRequestManagement />
    </div>
  );
}
