import { SubmissionManagement } from '@/components/teacher/submission/SubmissionManagement';

export default function SubmissionHistoryPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Riwayat Setoran</h1>
      <SubmissionManagement />
    </div>
  );
}
