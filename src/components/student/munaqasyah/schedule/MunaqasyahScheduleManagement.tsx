'use client';

import useSWR from 'swr';
import { ErrorState } from '@/components/layout/error/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { MunaqasyahScheduleTable } from './MunaqasyahScheduleTable';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function MunaqasyahScheduleManagement() {
  const { data, error, isLoading, mutate } = useSWR('/api/student/munaqasyah/schedule', fetcher);

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
      <MunaqasyahScheduleTable data={data.data} title="Daftar Jadwal Munaqasyah" />
    </div>
  );
}
