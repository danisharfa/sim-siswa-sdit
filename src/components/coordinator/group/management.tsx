'use client';

import useSWR from 'swr';
import { Skeleton } from '@/components/ui/skeleton';
import { GroupTable } from '@/components/coordinator/group/group-table';
import { AddGroupForm } from '@/components/coordinator/group/add-form';
import { GroupHistoryTable } from '@/components/coordinator/group/history-table';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function GroupManagement() {
  const {
    data: groupData,
    isLoading: loadingGroup,
    mutate,
  } = useSWR('/api/coordinator/group', fetcher);

  const { data: historyData, isLoading: loadingHistory } = useSWR(
    '/api/coordinator/group/history',
    fetcher
  );

  if (loadingGroup || loadingHistory) {
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
      <GroupTable data={groupData.data} title="Daftar Kelompok Aktif" onRefresh={mutate} />
      <GroupHistoryTable data={historyData.data} title="Riwayat Kelompok" />
    </div>
  );
}
