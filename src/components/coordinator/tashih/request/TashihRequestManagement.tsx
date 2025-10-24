'use client';

import useSWR from 'swr';
import { ErrorState } from '@/components/layout/error/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { TashihRequestTable } from './TashihRequestTable';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function TashihRequestManagement() {
  const { data, error, isLoading, mutate } = useSWR('/api/coordinator/tashih/request', fetcher);

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
      <TashihRequestTable data={data.data} title="Daftar Permintaan Tashih Siswa" onRefresh={mutate} />
    </div>
  );
}
