'use client';

import useSWR from 'swr';
import { ErrorState } from '@/components/layout/error/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { AddClassroomMembersForm } from '@/components/admin/classroom-members/AddClassroomMembersForm';
import { ClassroomMembersTable } from '@/components/admin/classroom-members/ClassroomMembersTable';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ClassroomMembersManagement({ classroomId }: { classroomId: string }) {
  const { data, error, isLoading, mutate } = useSWR(`/api/admin/classroom/${classroomId}/member`, fetcher);

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
      <AddClassroomMembersForm classroomId={classroomId} onMemberAdded={mutate} />
      <ClassroomMembersTable
        data={data.data}
        title="Daftar Siswa"
        classroomId={classroomId}
        onRefresh={mutate}
      />
    </div>
  );
}
