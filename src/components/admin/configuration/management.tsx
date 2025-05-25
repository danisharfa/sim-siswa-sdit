'use client';

import useSWR from 'swr';
import { AcademicPeriodForm } from './academic-period-form';
import { SchoolInfoForm } from './school-info-form';
import { Skeleton } from '@/components/ui/skeleton';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ConfigurationManagement() {
  const { data, isLoading, mutate } = useSWR('/api/academicSetting', fetcher);

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="w-full h-[180px]" />
        <Skeleton className="w-full h-[180px]" />
      </div>
    );
  }

  const academicSetting = data.data;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <AcademicPeriodForm
        data={{
          currentYear: academicSetting.currentYear,
          currentSemester: academicSetting.currentSemester,
        }}
        onSave={mutate}
      />
      <SchoolInfoForm
        data={{
          currentPrincipalName: academicSetting.currentPrincipalName ?? '',
          schoolName: academicSetting.schoolName ?? '',
          schoolAddress: academicSetting.schoolAddress ?? '',
        }}
        onSave={mutate}
      />
    </div>
  );
}
