'use client';

import useSWR from 'swr';
import { ErrorState } from '@/components/layout/error/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { TashihScheduleTable } from './TashihScheduleTable';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function TashihScheduleManagement() {
  const { data, error, isLoading, mutate } = useSWR('/api/teacher/tashih/schedule', fetcher);

  if (error) {
    return <ErrorState onRetry={() => mutate()} />;
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TashihScheduleTable
        data={data.data}
        title="Daftar Jadwal Tashih Siswa Bimbingan"
      />
    </div>
  );
}
