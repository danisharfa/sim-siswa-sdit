'use client';

import useSWR from 'swr';
import { ProgressBarCard, type ProgressItem } from './ProgressBarCard';

type StudentChartResponse = {
  studentId: string;
  studentName: string;
  currentPeriod: string;
  currentGroup: {
    id: string;
    name: string;
    className: string;
  } | null;
  lastSurah: string;
  currentJuz: number | null;
  totalProgress: {
    completedJuz: number;
    totalJuz: number;
    overallPercent: number;
  };
  progress: {
    juzId: number;
    juzName: string;
    completedSurah: number;
    totalSurah: number;
    percent: number;
    status: 'SELESAI' | 'SEDANG_DIJALANI' | 'BELUM_DIMULAI';
  }[];
};

const fetcher = async (url: string): Promise<StudentChartResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  const data = await res.json();

  if (data && typeof data === 'object' && 'success' in data && data.success === false) {
    throw new Error(data.error || data.message || 'API returned an error');
  }

  return data;
};

type TahfidzChartProps = {
  academicYear: string;
  semester: string;
  groupId: string;
  period?: string;
};

export function TahfidzChart({ period }: TahfidzChartProps) {
  const apiUrl = `/api/student/chart/${period}/tahfidz`;

  console.log('TahfidzChart render:', { period, apiUrl });

  const { data, isLoading, error } = useSWR<StudentChartResponse>(apiUrl, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 0,
  });

  // Convert data to ProgressItem format
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

  // Sort by juz number
  progressItems.sort((a, b) => Number(a.id) - Number(b.id));

  return (
    <ProgressBarCard
      title="Progres Tahfidz Saya"
      description="Progres kumulatif tahfidz saya sampai dengan periode yang dipilih"
      items={progressItems}
      isLoading={isLoading}
      error={error}
      emptyMessage="Belum ada progres tahfidz"
    />
  );
}
