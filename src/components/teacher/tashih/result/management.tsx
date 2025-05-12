'use client';

import useSWR from 'swr';
import { Skeleton } from '@/components/ui/skeleton';
import { TeacherTashihResultTable } from './table';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function TeacherTashihResultManagement() {
  const { data, error, isLoading } = useSWR('/api/teacher/tashih/result', fetcher);

  if (isLoading)
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-1/3 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );

  if (error) return <p>Gagal memuat data jadwal ujian</p>;

  return (
    <div className="p-4 space-y-4">
      <TeacherTashihResultTable data={data.data} />
    </div>
  );
}
