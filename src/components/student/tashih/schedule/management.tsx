import { use } from 'react';
import { fetchTashihSchedule } from '@/lib/data/student/tashih-schedule';
import { StudentTashihScheduleTable } from '@/components/student/tashih/schedule/table';

export function StudentTashihScheduleManagement() {
  const schedules = use(fetchTashihSchedule());

  return (
    <div className="p-4 space-y-4">
      <StudentTashihScheduleTable data={schedules} />
    </div>
  );
}
