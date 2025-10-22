'use client';

import useSWR from 'swr';
import { ErrorState } from '@/components/layout/error/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { AddGroupForm } from '@/components/coordinator/group/AddGroupForm';
import { GroupTable } from '@/components/coordinator/group/GroupTable';
import { GroupHistoryTable } from '@/components/coordinator/group/GroupHistoryTable';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function GroupManagement() {
  const {
    data: groupData,
    error: groupError,
    isLoading: groupLoading,
    mutate,
  } = useSWR('/api/coordinator/group', fetcher);

  const {
    data: historyData,
    error: historyError,
    isLoading: historyLoading,
  } = useSWR('/api/coordinator/group/history', fetcher);

  if (groupError || historyError) {
    return <ErrorState onRetry={() => mutate()} />;
  }

  if (groupLoading || historyLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-70 w-full" />
        <Skeleton className="h-70 w-full" />
        <Skeleton className="h-70 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AddGroupForm onGroupAdded={mutate} />
      <GroupTable data={groupData.data} title="Daftar Kelompok Aktif" onRefresh={mutate} />
      <GroupHistoryTable data={historyData.data} title="Riwayat Kelompok" />
    </div>
  );
}
