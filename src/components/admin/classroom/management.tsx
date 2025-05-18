'use client';

import useSWR from 'swr';
import { Skeleton } from '@/components/ui/skeleton';
import { AddClassroomForm } from '@/components/admin/classroom/add-form';
import { ClassroomTable } from '@/components/admin/classroom/classroom-table';
import { ClassroomHistoryTable } from '@/components/admin/classroom/history-table';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ClassroomManagement() {
  const { data: settingData, isLoading: loadingSetting } = useSWR('/api/academicSetting', fetcher);

  const {
    data: classData,
    isLoading: loadingClassroom,
    mutate,
  } = useSWR('/api/admin/classroom', fetcher);

  const { data: historyData, isLoading: loadingHistory } = useSWR(
    '/api/admin/classroom/history',
    fetcher
  );

  if (loadingClassroom || loadingSetting || loadingHistory) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-70 w-full" />
        <Skeleton className="h-70 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AddClassroomForm
        onClassroomAdded={mutate}
        defaultAcademicYear={settingData?.data?.currentYear ?? ''}
        defaultSemester={settingData?.data?.currentSemester ?? 'GANJIL'}
      />
      <ClassroomTable data={classData.data} title="Daftar Kelas" onRefresh={mutate} />
      <ClassroomHistoryTable data={historyData.data} title="Riwayat Kelas" />
    </div>
  );
}
