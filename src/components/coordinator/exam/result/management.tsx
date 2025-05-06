'use client';

import useSWR from 'swr';
import { Skeleton } from '@/components/ui/skeleton';
import { AddResultForm } from './add-form';
import { ExamResultTable } from './table';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ExamResultManagement() {
  const { data, error, isLoading, mutate } = useSWR('/api/coordinator/exam/result', fetcher);

  if (isLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-8 w-1/3 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data?.success) {
    return <p className="text-red-500">Gagal memuat hasil ujian</p>;
  }

  return (
    <div className="space-y-6">
      <AddResultForm onSaved={mutate} />
      <ExamResultTable data={data.data} title="Daftar Hasil Ujian" />
    </div>
  );
}
