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
  currentWafa: number | null;
  lastWafa: string;
  totalProgress: {
    completedBooks: number;
    totalBooks: number;
    overallPercent: number;
  };
  progress: {
    wafaId: number;
    wafaName: string;
    completedPages: number;
    totalPages: number | null;
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

type WafaChartProps = {
  academicYear: string;
  semester: string;
  groupId: string;
  period?: string;
};

export function WafaChart({ period }: WafaChartProps) {
  const apiUrl = `/api/student/chart/${period}/tahsin/wafa`;

  console.log('WafaChart render:', { period, apiUrl });

  const { data, isLoading, error } = useSWR<StudentChartResponse>(apiUrl, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 0,
  });

  // Convert data to ProgressItem format
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

  // Sort by wafa number
  progressItems.sort((a, b) => Number(a.id) - Number(b.id));

  return (
    <ProgressBarCard
      title="Progres Wafa Saya"
      description="Progres kumulatif wafa saya sampai dengan periode yang dipilih"
      items={progressItems}
      isLoading={isLoading}
      error={error}
      emptyMessage="Belum ada progres wafa"
    />
  );
}
