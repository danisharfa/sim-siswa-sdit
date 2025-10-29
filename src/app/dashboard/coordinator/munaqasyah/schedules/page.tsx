import { MunaqasyahScheduleManagement } from '@/components/coordinator/munaqasyah/schedule/MunaqasyahScheduleManagement';

export default function CoordinatorMunaqasyahSchedulePage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Penjadwalan Munaqasyah</h1>
      <MunaqasyahScheduleManagement />
    </div>
  );
}
