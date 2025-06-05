import { use } from 'react';
import { fetchWeeklyTargetHistory } from '@/lib/data/teacher/weekly-target-history';
import { TargetHistoryTable } from './TargetHistoryTable';

interface TargetHistoryManagementProps {
  studentId: string;
  groupId: string;
}

export function TargetHistoryManagement({ studentId, groupId }: TargetHistoryManagementProps) {
  const targetHistory = use(fetchWeeklyTargetHistory(studentId, groupId));

  return (
    <div className="space-y-6">
      <TargetHistoryTable data={targetHistory} title="Daftar Riwayat Target Setoran" />
    </div>
  );
}
