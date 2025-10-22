'use client';

import useSWR from 'swr';
import { ErrorState } from '@/components/layout/error/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { AcademicPeriodForm } from './AcademicPeriodForm';
import { SchoolInfoForm } from './SchoolInfoForm';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ConfigurationManagement() {
  const { data, error, isLoading, mutate } = useSWR('/api/academicSetting', fetcher);

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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <AcademicPeriodForm
        data={{
          currentYear: data.data.currentYear,
          currentSemester: data.data.currentSemester,
        }}
        onSave={mutate}
      />
      <SchoolInfoForm
        data={{
          currentPrincipalName: data.data.currentPrincipalName ?? '',
          schoolName: data.data.schoolName ?? '',
          schoolAddress: data.data.schoolAddress ?? '',
        }}
        onSave={mutate}
      />
    </div>
  );
}
