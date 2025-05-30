import { fetchTashihResult } from '@/lib/data/student/tashih-result';
import { StudentTashihResultTable } from './table';
import { use } from 'react';

export function StudentTashihResultManagement() {
  const results = use(fetchTashihResult());
  return (
    <div className="p-4 space-y-4">
      <StudentTashihResultTable data={results} />
    </div>
  );
}
