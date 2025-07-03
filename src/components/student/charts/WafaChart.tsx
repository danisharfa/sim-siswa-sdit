'use client';

import useSWR from 'swr';
import { ProgressBarCard, type ProgressItem } from './ProgressBarCard';

type StudentChartResponse = {
  studentId: string;
  studentName: string;
  currentWafa: number | null;
  lastWafa: string;
  progress: {
    wafaId: number;
    wafaName: string;
    completedPages: number;
    totalPages: number | null;
    percent: number;
    status: 'SELESAI' | 'SEDANG_DIJALANI' | 'BELUM_DIMULAI';
  }[];
};

type WafaChartProps = {
  period: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function WafaChart({ period }: WafaChartProps) {
  const { data, isLoading, error } = useSWR<StudentChartResponse>(
    `/api/student/chart/${period}/tahsin/wafa`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 0,
    }
  );

  const progressItems: ProgressItem[] =
    data?.progress.map((item) => ({
      id: item.wafaId,
      name: item.wafaName,
      completed: item.completedPages,
      total: item.totalPages || 0,
      percent: item.percent,
      status: item.status,
      subtitle: `${item.completedPages} dari ${item.totalPages || 0} halaman`,
    })) || [];

  // Sort wafa
  progressItems.sort((a, b) => Number(a.id) - Number(b.id));

  return (
    <ProgressBarCard
      title="Progres Wafa"
      items={progressItems}
      isLoading={isLoading}
      error={error}
      emptyMessage="Belum ada progres wafa"
    />
  );
}
