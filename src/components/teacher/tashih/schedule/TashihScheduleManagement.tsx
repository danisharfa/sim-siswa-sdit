import { use } from 'react';
import { fetchTashihSchedule } from '@/lib/data/teacher/tashih-schedule';
import { TashihScheduleTable } from './TashihScheduleTable';

export function TashihScheduleManagement() {
  const schedules = use(fetchTashihSchedule());

  return (
    <div className="space-y-4">
      <TashihScheduleTable data={schedules} />
    </div>
  );
}
