import { use } from 'react';
import { fetchTargets } from '@/lib/data/student/target';
import { TargetTable } from './TargetTable';

export function TargetManagement() {
  const targetData = use(fetchTargets());

  return (
    <div className="space-y-4">
      <TargetTable data={targetData} title="Daftar Target Setoran" />
    </div>
  );
}
