'use client';

import useSWR from 'swr';
import { Skeleton } from '@/components/ui/skeleton';
import { TargetHistoryTable } from './TargetHistoryTable';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function TargetManagement() {
  const { data, isLoading, mutate } = useSWR('/api/teacher/weekly-target/history', fetcher);

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
      <TargetHistoryTable data={data?.data || []} title="Riwayat Target Setoran Siswa" onRefresh={mutate} />
    </div>
  );
}