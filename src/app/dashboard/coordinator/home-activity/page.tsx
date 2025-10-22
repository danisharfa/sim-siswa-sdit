import { HomeActivityManagement } from '@/components/coordinator/home-activity/HomeActivityManagement';

export default function HomeActivityHistoryPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Riwayat Aktivitas Rumah</h1>
      <HomeActivityManagement />
    </div>
  );
}
