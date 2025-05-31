import { TashihResultManagement } from '@/components/coordinator/tashih/result/TashihResultManagement';

export default function CoordinatorExamResultPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Hasil Ujian Siswa</h1>
      <TashihResultManagement />
    </div>
  );
}
