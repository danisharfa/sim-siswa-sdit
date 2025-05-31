import { HomeActivityManagement } from '@/components/student/home-activity/HomeActivityManagement';

export default function StudentSubmissionHistoryPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Riwayat Aktivitas Rumah</h1>
      <HomeActivityManagement />
    </div>
  );
}
