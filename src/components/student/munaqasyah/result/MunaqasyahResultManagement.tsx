import { use } from 'react';
import { fetchMunaqasyahResult } from '@/lib/data/student/munaqasyah-result';
import { MunaqasyahResultTable } from '@/components/student/munaqasyah/result/MunaqasyahResultTable';

export function MunaqasyahResultManagement() {
  const schedules = use(fetchMunaqasyahResult());

  return (
    <div className="p-4 space-y-4">
      <MunaqasyahResultTable data={schedules} />
    </div>
  );
}
