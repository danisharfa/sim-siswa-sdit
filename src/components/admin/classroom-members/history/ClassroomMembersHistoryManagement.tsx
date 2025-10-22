'use client';

import useSWR from 'swr';
import { ErrorState } from '@/components/layout/error/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { ClassroomMembersHistoryTable } from '@/components/admin/classroom-members/history/ClassroomMembersHistoryTable';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ClassroomMembersHistoryManagement({ classroomId }: { classroomId: string }) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/admin/classroom/${classroomId}/member/history`,
    fetcher
  );

  if (error) {
    return <ErrorState onRetry={() => mutate()} />;
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-70 w-full" />
        <Skeleton className="h-70 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ClassroomMembersHistoryTable
        data={data.data || []}
        title="Daftar Siswa"
        classroomId={classroomId}
        onRefresh={mutate}
      />
    </div>
  );
}
