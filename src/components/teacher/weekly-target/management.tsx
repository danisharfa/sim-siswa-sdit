'use client';

import useSWR from 'swr';
import { Skeleton } from '@/components/ui/skeleton';
import { TargetForm } from './target-form';
import { TargetTable } from './table';

interface TargetManagementProps {
  student: { id: string; nis: string; fullName: string };
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
      <TargetTable data={data.data} title="Daftar Target Setoran" onRefresh={mutate} />
    </div>
  );
}
