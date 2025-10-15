'use client';

import useSWR from 'swr';
import { Skeleton } from '@/components/ui/skeleton';
import { ClassroomMembersHistoryTable } from '@/components/admin/classroom-members/history/ClassroomMembersHistoryTable';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ClassroomMembersHistoryManagement({ classroomId }: { classroomId: string }) {
  const { data, isLoading, mutate } = useSWR(
    `/api/admin/classroom/${classroomId}/member/history`,
    fetcher
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-70 w-full" />
        <Skeleton className="h-70 w-full" />
      </div>
    );
  }

  if (!data || !data.success) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Tidak ada data riwayat siswa</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      <ClassroomMembersHistoryTable
        data={data.data || []}
        title="Daftar Siswa"
        classroomId={classroomId}
        onRefresh={mutate}
      />
    </div>
  );
}
