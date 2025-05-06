'use client';

import useSWR from 'swr';
import { Skeleton } from '@/components/ui/skeleton';
import { TeacherExamScheduleTable } from './table';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function TeacherExamScheduleManagement() {
  const { data, error, isLoading } = useSWR('/api/teacher/exam/schedule', fetcher);

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
      <h1 className="text-2xl font-bold">Jadwal Ujian Siswa Bimbingan</h1>
      <TeacherExamScheduleTable data={data.data} />
    </div>
  );
}
