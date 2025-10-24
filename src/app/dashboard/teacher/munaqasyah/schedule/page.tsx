import { MunaqasyahScheduleManagement } from '@/components/teacher/munaqasyah/schedule/MunaqasyahScheduleManagement';

export const dynamic = 'force-dynamic';

export default function TeacherMunaqasyahSchedulePage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Jadwal Munaqasyah Siswa</h1>
        <MunaqasyahScheduleManagement />
    </div>
  );
}
