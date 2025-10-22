import { use } from 'react';
import { fetchMunaqasyahSchedule } from '@/lib/data/teacher/munaqasyah-schedule';
import { MunaqasyahScheduleTable } from './MunaqasyahScheduleTable';

export function MunaqasyahScheduleManagement() {
  const schedules = use(fetchMunaqasyahSchedule());

  return (
    <div className="space-y-4">
      <MunaqasyahScheduleTable data={schedules} />
    </div>
  );
}
