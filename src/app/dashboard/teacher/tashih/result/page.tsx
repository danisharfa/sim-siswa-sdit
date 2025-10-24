import { TashihResultManagement } from '@/components/teacher/tashih/result/TashihResultManagement';

export const dynamic = 'force-dynamic';

export default function TeacherTashihFormPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Hasil Tashih Siswa</h1>
      <TashihResultManagement />
    </div>
  );
}
