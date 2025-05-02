'use client';

import useSWR from 'swr';
import { Skeleton } from '@/components/ui/skeleton';
import { GroupMembersTable } from '@/components/teacher/group-members/group-members-table';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function GroupDetailsManagement({ groupId }: { groupId: string }) {
  const { data, isLoading } = useSWR(`/api/teacher/group/${groupId}/member`, fetcher);

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-70 w-full" />
        <Skeleton className="h-70 w-full" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      <GroupMembersTable data={data.data} title="Daftar Anggota Kelompok" />
    </div>
  );
}
