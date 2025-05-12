import { TashihRequestManagement } from '@/components/coordinator/tashih/request/management';

export default function CoordinatorExamRequestsPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Tashih Siswa</h1>
      <TashihRequestManagement />
    </div>
  );
}
