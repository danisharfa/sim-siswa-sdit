'use client';

import useSWR from 'swr';
import { Skeleton } from '@/components/ui/skeleton';
import { AddClassroomForm } from '@/components/admin/classroom/add-classroom-form';
import { ClassroomTable } from '@/components/admin/classroom/classroom-table';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ClassroomManagement() {
  const { data, isLoading, mutate } = useSWR('/api/admin/classroom', fetcher);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-70 w-full" />
        <Skeleton className="h-70 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AddClassroomForm onClassroomAdded={mutate} />
      <ClassroomTable data={data.data} title="Daftar Kelas" onRefresh={mutate} />
    </div>
  );
}
