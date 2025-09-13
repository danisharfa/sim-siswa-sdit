import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { HomeActivityHistoryManagement } from '@/components/coordinator/home-activity/HomeActivityHistoryManagement';

export const dynamic = 'force-dynamic';

export default function HomeActivityHistoryPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Riwayat Aktivitas Rumah</h1>
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        }
      >
        <HomeActivityHistoryManagement />
      </Suspense>
    </div>
  );
}
