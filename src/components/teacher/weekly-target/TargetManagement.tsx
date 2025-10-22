'use client';

import useSWR from 'swr';
import { ErrorState } from '@/components/layout/error/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { TargetTable } from './TargetTable';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function TargetManagement() {
  const { data, error, isLoading, mutate } = useSWR('/api/teacher/weekly-target', fetcher);

  if (error) {
    return <ErrorState onRetry={() => mutate()} />;
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-70 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TargetTable data={data?.data || []} title="Daftar Target Setoran Siswa" onRefresh={mutate} />
    </div>
  );
}
