'use client';

import useSWR from 'swr';
import { ErrorState } from '@/components/layout/error/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { TashihScheduleTable } from './TashihScheduleTable';
import { AddTashihScheduleForm } from './AddTashihScheduleForm';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function TashihScheduleManagement() {
  const { data, error, isLoading, mutate } = useSWR('/api/coordinator/tashih/schedule', fetcher);

  if (error) {
    return <ErrorState onRetry={() => mutate()} />;
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-8 w-1/3 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AddTashihScheduleForm onScheduleAdded={mutate} />
      <TashihScheduleTable data={data.data} title="Daftar Jadwal Tashih Semua Siswa" />
    </div>
  );
}
