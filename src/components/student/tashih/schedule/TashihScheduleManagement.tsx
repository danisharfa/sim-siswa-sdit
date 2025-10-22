import { use } from 'react';
import { fetchTashihSchedule } from '@/lib/data/student/tashih-schedule';
import { TashihScheduleTable } from '@/components/student/tashih/schedule/TashihScheduleTable';

export function TashihScheduleManagement() {
  const schedules = use(fetchTashihSchedule());

  return (
    <div className="space-y-4">
      <TashihScheduleTable data={schedules} />
    </div>
  );
}
