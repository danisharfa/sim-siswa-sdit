import { TashihScheduleManagement } from '@/components/coordinator/tashih/schedule/TashihScheduleManagement';

export default function CoordinatorExamSchedulePage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Manajemen Jadwal Tashih</h1>
      <TashihScheduleManagement />
    </div>
  );
}
