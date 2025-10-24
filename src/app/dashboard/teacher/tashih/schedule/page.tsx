import { TashihScheduleManagement } from '@/components/teacher/tashih/schedule/TashihScheduleManagement';

export const dynamic = 'force-dynamic';

export default function TeacherTashihSchedulePage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Jadwal Tashih Siswa</h1>
      <TashihScheduleManagement />
    </div>
  );
}
