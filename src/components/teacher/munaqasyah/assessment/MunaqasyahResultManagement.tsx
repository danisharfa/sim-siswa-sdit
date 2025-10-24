'use client';

import useSWR from 'swr';
import { ErrorState } from '@/components/layout/error/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { AssessmentForm } from './AssessmentForm';
import { MunaqasyahResultTable } from './MunaqasyahResultTable';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function MunaqasyahResultManagement() {
  const { data, error, isLoading, mutate } = useSWR('/api/teacher/munaqasyah/result', fetcher);

  if (error) {
    return <ErrorState onRetry={() => mutate()} />;
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-8 w-1/3 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AssessmentForm onSaved={mutate} />
      <MunaqasyahResultTable data={data.data} title="Daftar Hasil Munaqasyah Siswa" />
    </div>
  );
}
