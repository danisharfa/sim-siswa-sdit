import { use } from 'react';
import { fetchTashihSchedule } from '@/lib/data/teacher/tashih-schedule';
import { TeacherTashihScheduleTable } from './table';

export function TeacherTashihScheduleManagement() {
  const schedules = use(fetchTashihSchedule());

  return (
    <div className="p-4 space-y-4">
      <TeacherTashihScheduleTable data={schedules} />
    </div>
  );
}
