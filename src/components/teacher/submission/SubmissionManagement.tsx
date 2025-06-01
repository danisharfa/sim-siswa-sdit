'use client';

import useSWR from 'swr';
import { Skeleton } from '@/components/ui/skeleton';
import { SubmissionTable } from '@/components/teacher/submission/SubmissionTable';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function SubmissionManagement() {
  const { data, isLoading, mutate } = useSWR('/api/teacher/submission', fetcher);

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
      <SubmissionTable data={data.data} title="Riwayat Setoran Siswa" onRefresh={mutate} />
    </div>
  );
}
