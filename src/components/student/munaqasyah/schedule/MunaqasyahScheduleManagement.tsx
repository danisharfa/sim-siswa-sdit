import { use } from 'react';
import { fetchMunaqasyahSchedule } from '@/lib/data/student/munaqasyah-schedule';
import { MunaqasyahScheduleTable } from '@/components/student/munaqasyah/schedule/MunaqasyahScheduleTable';

export function MunaqasyahScheduleManagement() {
  const schedules = use(fetchMunaqasyahSchedule());

  return (
    <div className="p-4 space-y-4">
      <MunaqasyahScheduleTable data={schedules} />
    </div>
  );
}
