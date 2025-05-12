'use client';

import useSWR from 'swr';
import { Skeleton } from '@/components/ui/skeleton';
import { TeacherTashihScheduleTable } from './table';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function TeacherTashihScheduleManagement() {
  const { data, error, isLoading } = useSWR('/api/teacher/tashih/schedule', fetcher);

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
      <TeacherTashihScheduleTable data={data.data} />
    </div>
  );
}
