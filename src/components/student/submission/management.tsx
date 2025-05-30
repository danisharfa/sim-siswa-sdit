import { use } from 'react';
import { fetchStudentSubmissionHistory } from '@/lib/data/student/submission-history';
import { StudentSubmissionHistoryTable } from '@/components/student/submission/table';

export function StudentSubmissionHistoryManagement() {
  const submissions = use(fetchStudentSubmissionHistory());

  return (
    <div className="p-4 space-y-4">
      <StudentSubmissionHistoryTable data={submissions} title="Riwayat Setoran" />
    </div>
  );
}
