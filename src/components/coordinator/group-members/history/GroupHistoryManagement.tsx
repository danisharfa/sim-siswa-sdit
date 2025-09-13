'use client';

import useSWR from 'swr';
import { Skeleton } from '@/components/ui/skeleton';
import { CoordinatorGroupHistoryMembersTable } from './CoordinatorGroupHistoryMembersTable';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface GroupHistoryManagementProps {
  groupId: string;
}

export function GroupHistoryManagement({ groupId }: GroupHistoryManagementProps) {
  const { data, isLoading } = useSWR(`/api/coordinator/group/${groupId}/history`, fetcher);

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CoordinatorGroupHistoryMembersTable
        data={data.data || []}
        title="Daftar Anggota Kelompok"
        groupId={groupId}
      />
    </div>
  );
}
