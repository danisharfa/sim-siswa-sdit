'use client';

import useSWR from 'swr';
import { ProgressBarCard, type ProgressItem } from './ProgressBarCard';

type StudentChartResponse = {
  studentId: string;
  studentName: string;
  lastSurah: string;
  currentJuz: number | null;
  progress: {
    juzId: number;
    juzName: string;
    completedSurah: number;
    totalSurah: number;
    percent: number;
    status: 'SELESAI' | 'SEDANG_DIJALANI' | 'BELUM_DIMULAI';
  }[];
};

type TahfidzChartProps = {
  period: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function TahfidzChart({ period }: TahfidzChartProps) {
  const { data, isLoading, error } = useSWR<StudentChartResponse>(
    `/api/student/chart/${period}/tahfidz`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 0,
    }
  );

  const progressItems: ProgressItem[] =
    data?.progress.map((item) => ({
      id: item.juzId,
      name: item.juzName,
      completed: item.completedSurah,
      total: item.totalSurah,
      percent: item.percent,
      status: item.status,
      subtitle: `${item.completedSurah} dari ${item.totalSurah} surah`,
    })) || [];

  // Sort juz
  progressItems.sort((a, b) => Number(b.id) - Number(a.id));

  return (
    <ProgressBarCard
      title="Progres Tahfidz"
      items={progressItems}
      isLoading={isLoading}
      error={error}
      emptyMessage="Belum ada progres tahfidz"
    />
  );
}
