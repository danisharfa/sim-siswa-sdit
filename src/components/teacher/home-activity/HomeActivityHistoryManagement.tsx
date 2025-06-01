import { use } from 'react';
import { fetchHomeActivityHistory } from '@/lib/data/teacher/home-activity';
import { HomeActivityHistoryTable } from '@/components/teacher/home-activity/HomeActivityHistoryTable';

export function HomeActivityHistoryManagement() {
  const submissions = use(fetchHomeActivityHistory());

  return (
    <div className="p-4 space-y-4">
      <HomeActivityHistoryTable data={submissions} title="Riwayat Setoran" />
    </div>
  );
}
