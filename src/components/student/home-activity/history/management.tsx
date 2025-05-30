'use client';

import useSWR from 'swr';
import { Skeleton } from '@/components/ui/skeleton';
import { StudentHomeActivityTable } from './table';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function StudentHomeActivityHistoryManagement() {
  const { data, isLoading, mutate } = useSWR('/api/student/home-activity', fetcher);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-[100px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <StudentHomeActivityTable
        data={data.data}
        title="Riwayat Aktivitas Rumah"
        onRefresh={mutate}
      />
    </div>
  );
}
