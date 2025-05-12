'use client';

import useSWR from 'swr';
import { Skeleton } from '@/components/ui/skeleton';
import { TashihScheduleTable } from './table';
import { AddScheduleForm } from './add-form';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function TashihScheduleManagement() {
  const { data, error, isLoading, mutate } = useSWR('/api/coordinator/tashih/schedule', fetcher);

  if (isLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-8 w-1/3 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) return <p>Gagal memuat data jadwal ujian</p>;

  return (
    <div className="space-y-6">
      <AddScheduleForm onScheduleAdded={mutate} />
      <TashihScheduleTable data={data.data} title="Jadwal Ujian Siswa" />
    </div>
  );
}
