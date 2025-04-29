'use client';

import useSWR from 'swr';
import { Skeleton } from '@/components/ui/skeleton';
import { GroupTable } from '@/components/teacher/group/group-table';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function GroupManagement() {
  const { data, error, isLoading } = useSWR('/api/teacher/group', fetcher);

  if (isLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-8 w-1/3 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) return <p>Gagal memuat data kelompok</p>;

  return (
    <div className="space-y-6">
      <GroupTable data={data.data} title="Daftar Kelompok" />
    </div>
  );
}
