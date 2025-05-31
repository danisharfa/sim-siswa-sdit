'use client';

import useSWR from 'swr';
import { Skeleton } from '@/components/ui/skeleton';
import { AddClassroomMembersForm } from '@/components/admin/classroom-members/AddClassroomMembersForm';
import { ClassroomMembersTable } from '@/components/admin/classroom-members/ClassroomMembersTable';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ClassroomMembersManagement({ classroomId }: { classroomId: string }) {
  const { data, isLoading, mutate } = useSWR(`/api/admin/classroom/${classroomId}/member`, fetcher);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-70 w-full" />
        <Skeleton className="h-70 w-full" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
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
