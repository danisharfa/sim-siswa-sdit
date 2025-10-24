'use client';

import useSWR from 'swr';
import { ErrorState } from '@/components/layout/error/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { TashihResultTable } from './TashihResultTable';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function TashihResultManagement() {
  const { data, error, isLoading, mutate } = useSWR('/api/teacher/tashih/result', fetcher);

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
      <TashihResultTable data={data.data} title="Daftar Hasil Tashih Siswa Bimbingan" />
    </div>
  );
}
