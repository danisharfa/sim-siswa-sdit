'use client';

import useSWR from 'swr';
import { Skeleton } from '@/components/ui/skeleton';
import { AddMemberForm } from '@/components/admin/group-members/add-member-form';
import { GroupMembersTable } from '@/components/admin/group-members/group-members-table';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function GroupDetailsManagement({ groupId }: { groupId: string }) {
  const { data, isLoading, mutate } = useSWR(`/api/admin/group/${groupId}/member`, fetcher);

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-70 w-full" />
        <Skeleton className="h-70 w-full" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
      <AddMemberForm groupId={groupId} onMemberAdded={mutate} />
      <GroupMembersTable
        data={data.data}
        title="Daftar Anggota Kelompok"
        groupId={groupId}
        onRefresh={mutate}
      />
    </div>
  );
}
