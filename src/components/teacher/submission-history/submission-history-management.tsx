'use client';

import useSWR from 'swr';
import { Skeleton } from '@/components/ui/skeleton';
import { SubmissionHistoryTable } from '@/components/teacher/submission-history/submission-history-table';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function SubmissionHistoryManagement() {
  const { data, error, isLoading } = useSWR('/api/submission', fetcher);

  if (isLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-8 w-1/3 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) return <p>Gagal memuat data setoran</p>;

  return <SubmissionHistoryTable data={data.data} title="Riwayat Setoran Siswa" />;
}
