import { use } from 'react';
import { fetchWeeklyTargetHistory } from '@/lib/data/teacher/teacher-group-member';
import { TargetHistoryTable } from './TargetHistoryTable';

interface TargetHistoryManagementProps {
  studentId: string;
}

export function TargetHistoryManagement({ studentId }: TargetHistoryManagementProps) {
  const targetHistory = use(fetchWeeklyTargetHistory(studentId));

  return (
    <div className="space-y-6">
      <TargetHistoryTable data={targetHistory} title="Daftar Riwayat Target Mingguan" />
    </div>
  );
}
