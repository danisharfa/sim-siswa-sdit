'use client';

import useSWR from 'swr';
import { AcademicSettingForm } from './academic-setting-form';
import { Skeleton } from '@/components/ui/skeleton';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ConfigurationManagement() {
  const { data, isLoading, mutate } = useSWR('/api/academicSetting', fetcher);

  if (isLoading) {
    return <Skeleton className="w-full h-[180px]" />;
  }

  return <AcademicSettingForm data={data?.data} onSave={mutate} />;
}
