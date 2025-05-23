'use client';

import useSWR from 'swr';
import { Skeleton } from '@/components/ui/skeleton';
import { SubmissionHistoryTable } from '@/components/teacher/submission/history/table';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function SubmissionHistoryManagement() {
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
      <SubmissionHistoryTable data={data.data} title="Riwayat Setoran Siswa" onRefresh={mutate} />;
    </div>
  );
}
