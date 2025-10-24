'use client';

import useSWR from 'swr';
import { ErrorState } from '@/components/layout/error/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { MunaqasyahResultTable } from './MunaqasyahResultTable';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function MunaqasyahResultManagement() {
  const { data, error, isLoading, mutate } = useSWR('/api/student/munaqasyah/result', fetcher);

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
      <MunaqasyahResultTable data={data.data} title="Daftar Hasil Munaqasyah" />
    </div>
  );
}
