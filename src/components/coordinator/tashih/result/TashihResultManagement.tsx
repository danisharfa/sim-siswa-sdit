'use client';

import useSWR from 'swr';
import { Skeleton } from '@/components/ui/skeleton';
import { AddTashihResultForm } from './AddTashihResultForm';
import { TashihResultTable } from './TashihResultTable';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function TashihResultManagement() {
  const { data, error, isLoading, mutate } = useSWR('/api/coordinator/tashih/result', fetcher);

  if (isLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-8 w-1/3 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data?.success) {
    return <p>Gagal memuat hasil ujian</p>;
  }

  return (
    <div className="space-y-6">
      <AddTashihResultForm onSaved={mutate} />
      <TashihResultTable data={data.data} title="Daftar Hasil Ujian" />
    </div>
  );
}
