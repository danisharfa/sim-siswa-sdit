'use client';

import useSWR from 'swr';
import { ErrorState } from '@/components/layout/error/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { AddClassroomForm } from '@/components/admin/classroom/AddClassroomForm';
import { ClassroomTable } from '@/components/admin/classroom/ClassroomTable';
import { ClassroomHistoryTable } from '@/components/admin/classroom/ClassroomHistoryTable';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ClassroomManagement() {
  const {
    data: settingData,
    error: settingError,
    isLoading: settingLoading,
  } = useSWR('/api/academicSetting', fetcher);

  const {
    data: classData,
    error: classError,
    isLoading: classLoading,
    mutate,
  } = useSWR('/api/admin/classroom', fetcher);

  const {
    data: historyData,
    error: historyError,
    isLoading: classHistoryLoading,
  } = useSWR('/api/admin/classroom/history', fetcher);

  if (settingError || classError || historyError) {
    return <ErrorState onRetry={() => mutate()} />;
  }

  if (settingLoading || classLoading || classHistoryLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-70 w-full" />
        <Skeleton className="h-70 w-full" />
        <Skeleton className="h-70 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AddClassroomForm
        onClassroomAdded={mutate}
        defaultAcademicYear={settingData?.data?.currentYear ?? ''}
        defaultSemester={settingData?.data?.currentSemester ?? 'GANJIL'}
      />
      <ClassroomTable data={classData.data} title="Daftar Kelas Aktif" onRefresh={mutate} />
      <ClassroomHistoryTable data={historyData.data} title="Riwayat Kelas" />
    </div>
  );
}
