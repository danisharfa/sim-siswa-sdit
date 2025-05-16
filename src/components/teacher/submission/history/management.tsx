import { use } from 'react';
import { fetchSubmissionHistory } from '@/lib/data/teacher/submission-history';
import { SubmissionHistoryTable } from '@/components/teacher/submission/history/table';

export function SubmissionHistoryManagement() {
  const submissions = use(fetchSubmissionHistory());

  return (
    <div className="p-4 space-y-4">
      <SubmissionHistoryTable data={submissions} title="Riwayat Setoran Siswa" />;
    </div>
  );
}
