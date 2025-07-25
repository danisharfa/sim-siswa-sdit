'use client';

import useSWR from 'swr';
import { Skeleton } from '@/components/ui/skeleton';
import { MunaqasyahResultForm } from './MunaqasyahResultForm';
import { MunaqasyahResultTable } from './MunaqasyahResultTable';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function MunaqasyahResultManagement() {
  const { data, error, isLoading, mutate } = useSWR('/api/coordinator/munaqasyah/result', fetcher);

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
      <MunaqasyahResultForm onSaved={mutate} />
      <MunaqasyahResultTable data={data.data} title="Daftar Munaqasyah Ujian" />
    </div>
  );
}
