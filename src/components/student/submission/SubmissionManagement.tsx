import { use } from 'react';
import { fetchStudentSubmissionHistory } from '@/lib/data/student/submission-history';
import { SubmissionTable } from '@/components/student/submission/SubmissionTable';

export function SubmissionManagement() {
  const submissions = use(fetchStudentSubmissionHistory());

  return (
    <div className="space-y-4">
      <SubmissionTable data={submissions} title="Daftar Setoran" />
    </div>
  );
}
