'use client';

import useSWR from 'swr';
import { Skeleton } from '@/components/ui/skeleton';
import { MunaqasyahRequestTable } from './MunaqasyahRequestTable';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function MunaqasyahRequestManagement() {
  const { data, error, isLoading, mutate } = useSWR('/api/coordinator/munaqasyah/request', fetcher);

  if (isLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-8 w-1/3 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) return <p>Gagal memuat data permintaan munaqasyah</p>;

  return (
    <div className="space-y-4">
      <MunaqasyahRequestTable data={data.data} title="Daftar Permintaan Ujian" onRefresh={mutate} />
    </div>
  );
}
