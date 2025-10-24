'use client';

import useSWR from 'swr';
import { ErrorState } from '@/components/layout/error/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { SubmissionTable } from '@/components/coordinator/submission/SubmissionTable';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function SubmissionManagement() {
  const { data, error, isLoading, mutate } = useSWR('/api/coordinator/submission', fetcher);

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
      <SubmissionTable data={data.data} title="Daftar Setoran Siswa" />
    </div>
  );
}
