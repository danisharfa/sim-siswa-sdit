import { TashihRequestManagement } from '@/components/coordinator/tashih/request/TashihRequestManagement';

export default function CoordinatorExamRequestsPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Permintaan Tashih Siswa</h1>
      <TashihRequestManagement />
    </div>
  );
}
