import { MunaqosyahScheduleManagement } from '@/components/coordinator/munaqasyah/schedule/management';

export default function CoordinatorMunaqosyahSchedulePage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Manajemen Jadwal Munaqasyah</h1>
      <MunaqosyahScheduleManagement />
    </div>
  );
}
