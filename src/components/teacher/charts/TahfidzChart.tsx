'use client';

import useSWR from 'swr';
import { ChartCard, type ChartDataItem } from './ChartCard';

type ChartResponse = {
  studentId: string;
  studentName: string;
  currentJuz: number | null;
  lastSurah: string;
  progress: {
    juzId: number;
    juzName: string;
    completedSurah: number;
    totalSurah: number | null;
    percent: number;
    status: 'SELESAI' | 'SEDANG_DIJALANI' | 'BELUM_DIMULAI';
  }[];
}[];

type AlquranDetailItem = {
  studentName: string;
  percent: number;
  status: 'SELESAI' | 'SEDANG_DIJALANI' | 'BELUM_DIMULAI';
  completedSurah: number;
  totalSurah: number | null;
};

type TahfidzChartData = {
  juz: string;
  selesai: number;
  proses: number;
  belumDimulai: number;
  detail: AlquranDetailItem[];
};

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  const data = await res.json();

  if (data && typeof data === 'object' && 'success' in data && data.success === false) {
    throw new Error(data.error || data.message || 'API returned an error');
  }

  if (!Array.isArray(data)) {
    throw new Error('Invalid data format received from API');
  }

  return data;
};

type TahfidzChartProps = {
  academicYear: string;
  semester: string;
  groupId: string;
};

export function TahfidzChart({ academicYear, semester, groupId }: TahfidzChartProps) {
  const period = `${encodeURIComponent(academicYear)}-${semester}`;
  const group = groupId || 'all';

  const apiUrl = `/api/teacher/chart/${period}/${group}/tahfidz`;

  // console.log('TahfidzChart render:', { academicYear, semester, groupId, period, group, apiUrl });

  const { data, isLoading, error } = useSWR<ChartResponse>(apiUrl, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 0,
  });

  const countMap: Record<number, Omit<TahfidzChartData, 'juz'>> = {};

  for (let i = 1; i <= 30; i++) {
    countMap[i] = { selesai: 0, proses: 0, belumDimulai: 0, detail: [] };
  }

  if (Array.isArray(data)) {
    data.forEach((student) => {
      student.progress.forEach((p) => {
        if (p.status === 'SELESAI') {
          countMap[p.juzId].selesai += 1;
        } else if (p.status === 'SEDANG_DIJALANI') {
          countMap[p.juzId].proses += 1;
        } else {
          countMap[p.juzId].belumDimulai += 1;
        }
        countMap[p.juzId].detail.push({
          studentName: student.studentName,
          percent: p.percent,
          status: p.status,
          completedSurah: p.completedSurah,
          totalSurah: p.totalSurah,
        });
      });
    });
  }

  const chartData: ChartDataItem[] = Object.entries(countMap)
    .map(([juzId, value]) => ({
      juz: `Juz ${juzId}`,
      selesai: value.selesai,
      proses: value.proses,
      belumDimulai: value.belumDimulai,
      detail: value.detail,
    }))
    .sort(
      (a, b) =>
        Number((a.juz as string).replace('Juz ', '')) -
        Number((b.juz as string).replace('Juz ', ''))
    );

  const renderDetailItem = (siswa: ChartDataItem['detail'][0], idx: number) => {
    const alquranSiswa = siswa as AlquranDetailItem;
    return (
      <div key={idx} className="flex flex-col border-b pb-2 gap-1">
        <div className="flex justify-between">
          <span>
            {siswa.studentName}{' '}
            <span className="text-muted-foreground">
              (
              {siswa.status === 'SEDANG_DIJALANI'
                ? 'Sedang Dijalani'
                : siswa.status === 'SELESAI'
                ? 'Selesai'
                : 'Belum Dimulai'}
              )
            </span>
          </span>
          <span className="font-medium">{siswa.percent}%</span>
        </div>
        <div className="text-xs text-muted-foreground flex gap-2">
          <span>
            Surah: <b>{alquranSiswa.completedSurah}</b> / {alquranSiswa.totalSurah ?? '-'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <ChartCard
      title="Progres Tahfidz Siswa"
      description="Progres kumulatif tahfidz siswa sampai dengan periode yang dipilih"
      data={chartData}
      xAxisKey="juz"
      isLoading={isLoading}
      error={error}
      renderDetailItem={renderDetailItem}
    />
  );
}
