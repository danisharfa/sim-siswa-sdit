'use client';

import useSWR from 'swr';
import { Skeleton } from '@/components/ui/skeleton';
import { ExamRequestTable } from './table';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ExamRequestManagement() {
  const { data, error, isLoading, mutate } = useSWR('/api/coordinator/exam/request', fetcher);

  if (isLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-8 w-1/3 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) return <p>Gagal memuat data permintaan ujian</p>;

  return (
    <div className="space-y-6">
      <ExamRequestTable data={data.data} title="Daftar Permintaan Ujian" onRefresh={mutate} />
    </div>
  );
}
