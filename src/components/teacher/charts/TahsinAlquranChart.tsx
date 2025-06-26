'use client';

import useSWR from 'swr';
import { ChartCard, type ChartDataItem } from './ChartCard';

type ChartResponse = {
  studentId: string;
  studentName: string;
  currentJuz: number | null;
  lastJuz: string;
  progress: {
    juzId: number;
    juzName: string;
    completedAyah: number;
    totalAyah: number;
    percent: number;
    status: 'SELESAI' | 'SEDANG_DIJALANI' | 'BELUM_DIMULAI';
  }[];
}[];

type TahsinDetailItem = {
  studentName: string;
  percent: number;
  status: 'SELESAI' | 'SEDANG_DIJALANI' | 'BELUM_DIMULAI';
  completedAyah: number;
  totalAyah: number;
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

type TahsinAlquranChartProps = {
  academicYear: string;
  semester: string;
  groupId: string;
};

export function TahsinAlquranChart({ academicYear, semester, groupId }: TahsinAlquranChartProps) {
  const period = `${encodeURIComponent(academicYear)}-${semester}`;
  const group = groupId || 'all';

  const { data, isLoading, error } = useSWR<ChartResponse>(
    `/api/teacher/chart/${period}/${group}/tahsin/alquran`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 0,
    }
  );

  const countMap: Record<
    number,
    { selesai: number; proses: number; belumDimulai: number; detail: TahsinDetailItem[] }
  > = {};

  // Inisialisasi semua juz berdasarkan data yang ada
  const allJuzIds = new Set<number>();
  if (Array.isArray(data)) {
    data.forEach((student) => {
      student.progress.forEach((p) => {
        allJuzIds.add(p.juzId);
      });
    });
  }

  Array.from(allJuzIds).forEach((juzId) => {
    countMap[juzId] = { selesai: 0, proses: 0, belumDimulai: 0, detail: [] };
  });

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
          completedAyah: p.completedAyah,
          totalAyah: p.totalAyah,
        });
      });
    });
  }

  const chartData: ChartDataItem[] = Object.entries(countMap)
    .map(([juzId, value]) => ({
      juz:
        data?.flatMap((s) => s.progress).find((p) => String(p.juzId) === juzId)?.juzName ??
        `Juz ${juzId}`,
      selesai: value.selesai,
      proses: value.proses,
      belumDimulai: value.belumDimulai,
      detail: value.detail,
    }))
    .sort((a, b) => (a.juz as string).localeCompare(b.juz as string, undefined, { numeric: true }));

  const renderDetailItem = (siswa: ChartDataItem['detail'][0], idx: number) => {
    const tahsinSiswa = siswa as TahsinDetailItem;
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
            Ayat: <b>{tahsinSiswa.completedAyah || 0}</b> / {tahsinSiswa.totalAyah || 0}
          </span>
        </div>
      </div>
    );
  };

  return (
    <ChartCard
      title="Progres Tahsin Al-Qur'an Siswa"
      description="Progres kumulatif tahsin Al-Qur'an siswa sampai dengan periode yang dipilih"
      data={chartData}
      xAxisKey="juz"
      isLoading={isLoading}
      error={error}
      renderDetailItem={renderDetailItem}
    />
  );
}
