import { SubmissionHistoryManagement } from '@/components/teacher/submission/history/submission-history-management';

export default function SubmissionHistoryPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Riwayat Setoran</h1>

      <SubmissionHistoryManagement />
    </div>
  );
}
