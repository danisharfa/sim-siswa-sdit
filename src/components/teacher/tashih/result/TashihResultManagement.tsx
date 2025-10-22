import { fetchTashihResult } from '@/lib/data/teacher/tashih-result';
import { TashihResultTable } from './TashihResultTable';
import { use } from 'react';

export function TashihResultManagement() {
  const results = use(fetchTashihResult());
  return (
    <div className="space-y-4">
      <TashihResultTable data={results} />
    </div>
  );
}
