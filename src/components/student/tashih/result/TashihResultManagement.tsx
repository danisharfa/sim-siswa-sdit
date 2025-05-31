import { fetchTashihResult } from '@/lib/data/student/tashih-result';
import { TashihResultTable } from './TashihResultTable';
import { use } from 'react';

export function TashihResultManagement() {
  const results = use(fetchTashihResult());
  return (
    <div className="p-4 space-y-4">
      <TashihResultTable data={results} />
    </div>
  );
}
