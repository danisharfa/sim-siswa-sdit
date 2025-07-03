'use client';

import useSWR from 'swr';
import { ProgressBarCard, type ProgressItem } from './ProgressBarCard';

type StudentChartResponse = {
  studentId: string;
  studentName: string;
  lastJuz: string;
  currentJuz: number | null;
  progress: {
    juzId: number;
    juzName: string;
    completedAyah: number;
    totalAyah: number;
    percent: number;
    status: 'SELESAI' | 'SEDANG_DIJALANI' | 'BELUM_DIMULAI';
  }[];
};

type TahsinAlquranChartProps = {
  period: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function TahsinAlquranChart({ period }: TahsinAlquranChartProps) {
  const { data, isLoading, error } = useSWR<StudentChartResponse>(
    `/api/student/chart/${period}/tahsin/alquran`,
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
      completed: item.completedAyah,
      total: item.totalAyah,
      percent: item.percent,
      status: item.status,
      subtitle: `${item.completedAyah} dari ${item.totalAyah} ayat`,
    })) || [];

  // Sort juz
  progressItems.sort((a, b) => Number(a.id) - Number(b.id));

  return (
    <ProgressBarCard
      title="Progres Tahsin Al-Quran"
      items={progressItems}
      isLoading={isLoading}
      error={error}
      emptyMessage="Belum ada progres tahsin Al-Quran"
    />
  );
}
