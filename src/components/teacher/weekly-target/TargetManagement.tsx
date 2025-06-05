'use client';

import useSWR from 'swr';
import { Skeleton } from '@/components/ui/skeleton';
import { TargetForm } from './TargetForm';
import { TargetTable } from './TargetTable';

interface TargetManagementProps {
  student: {
    id: string;
    nis: string;
    user: { fullName: string };
    group: {
      name: string;
      classroom: {
        name: string;
        academicYear: string;
        semester: string;
      };
    } | null;
  };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function TargetManagement({ student }: TargetManagementProps) {
  const { data, isLoading, mutate } = useSWR(
    `/api/teacher/weekly-target/student/${student.id}`,
    fetcher
  );

  if (isLoading) {
    return (
      <div className="space-y-6 mt-6">
        <Skeleton className="h-[100px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      <TargetForm studentId={student.id} onSubmit={mutate} />
      <TargetTable data={data?.data || []} title="Daftar Target Setoran" onRefresh={mutate} />
    </div>
  );
}
