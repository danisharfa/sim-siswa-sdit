import { GuruTesManagement } from '@/components/admin/guruTes/guruTes-management';

export default function ExamPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Manajemen Tes</h1>
      <GuruTesManagement />
    </div>
  );
}
