'use client';

import useSWR from 'swr';
import { Skeleton } from '@/components/ui/skeleton';
import { AddMemberForm } from '@/components/admin/classroom-members/add-member-form';
import { ClassroomMembersTable } from '@/components/admin/classroom-members/classroom-members-table';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ClassroomDetailsManagement({ classroomId }: { classroomId: string }) {
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
      <AddMemberForm classroomId={classroomId} onMemberAdded={mutate} />
      <ClassroomMembersTable
        data={data.data}
        title="Daftar Siswa"
        classroomId={classroomId}
        onRefresh={mutate}
      />
    </div>
  );
}
