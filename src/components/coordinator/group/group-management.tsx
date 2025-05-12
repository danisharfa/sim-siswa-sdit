'use client';

import useSWR from 'swr';
import { Skeleton } from '@/components/ui/skeleton';
import { GroupTable } from '@/components/coordinator/group/group-table';
import { AddGroupForm } from '@/components/coordinator/group/add-group-form';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function GroupManagement() {
  const { data, isLoading, mutate } = useSWR('/api/coordinator/group', fetcher);

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
      <AddGroupForm onGroupAdded={mutate} />
      <GroupTable data={data.data} title="Daftar Siswa" onRefresh={mutate} />
    </div>
  );
}
