import { fetchTashihResult } from '@/lib/data/teacher/tashih-result';
import { TeacherTashihResultTable } from './table';
import { use } from 'react';

export function TeacherTashihResultManagement() {
  const results = use(fetchTashihResult());
  return (
    <div className="p-4 space-y-4">
      <TeacherTashihResultTable data={results} />
    </div>
  );
}
