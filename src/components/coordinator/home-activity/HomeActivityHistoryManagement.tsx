import { use } from 'react';
import { fetchHomeActivityHistory } from '@/lib/data/coordinator/home-activity';
import { HomeActivityHistoryTable } from '@/components/coordinator/home-activity/HomeActivityHistoryTable';

export function HomeActivityHistoryManagement() {
  const activities = use(fetchHomeActivityHistory());

  return (
    <div className="p-4 space-y-4">
      <HomeActivityHistoryTable data={activities} title="Riwayat Aktivitas Rumah Semua Siswa" />
    </div>
  );
}
