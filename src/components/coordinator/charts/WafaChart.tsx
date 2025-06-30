'use client';

import useSWR from 'swr';
import { ChartCard, type ChartDataItem } from './ChartCard';

type ChartResponse = {
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
}[];

type WafaDetailItem = {
  studentName: string;
  percent: number;
  status: 'SELESAI' | 'SEDANG_DIJALANI' | 'BELUM_DIMULAI';
  completedPages: number;
  totalPages: number | null;
};

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  const data = await res.json();

  // Check if API returned an error object instead of data array
  if (data && typeof data === 'object' && 'success' in data && data.success === false) {
    throw new Error(data.error || data.message || 'API returned an error');
  }

  if (!Array.isArray(data)) {
    throw new Error('Invalid data format received from API');
  }

  return data;
};

type WafaChartProps = {
  academicYear: string;
  semester: string;
  groupId: string;
};

export function WafaChart({ academicYear, semester, groupId }: WafaChartProps) {
  const period = `${encodeURIComponent(academicYear)}-${semester}`;
  const group = groupId || 'all';

  const { data, isLoading, error } = useSWR<ChartResponse>(
    `/api/coordinator/chart/${period}/${group}/tahsin/wafa`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 0,
    }
  );

  const countMap: Record<
    number,
    { selesai: number; proses: number; belumDimulai: number; detail: WafaDetailItem[] }
  > = {};

  const allWafaIds = new Set<number>();
  if (Array.isArray(data)) {
    data.forEach((student) => {
      student.progress.forEach((p) => {
        allWafaIds.add(p.wafaId);
      });
    });
  }

  Array.from(allWafaIds).forEach((wafaId) => {
    countMap[wafaId] = { selesai: 0, proses: 0, belumDimulai: 0, detail: [] };
  });

  if (Array.isArray(data)) {
    data.forEach((student) => {
      student.progress.forEach((p) => {
        if (p.status === 'SELESAI') {
          countMap[p.wafaId].selesai += 1;
        } else if (p.status === 'SEDANG_DIJALANI') {
          countMap[p.wafaId].proses += 1;
        } else {
          countMap[p.wafaId].belumDimulai += 1;
        }
        countMap[p.wafaId].detail.push({
          studentName: student.studentName,
          percent: p.percent,
          status: p.status,
          completedPages: p.completedPages,
          totalPages: p.totalPages,
        });
      });
    });
  }

  const chartData: ChartDataItem[] = Object.entries(countMap)
    .map(([wafaId, value]) => ({
      wafa:
        data?.flatMap((s) => s.progress).find((p) => String(p.wafaId) === wafaId)?.wafaName ??
        `Wafa ${wafaId}`,
      selesai: value.selesai,
      proses: value.proses,
      belumDimulai: value.belumDimulai,
      detail: value.detail,
    }))
    .sort((a, b) =>
      (a.wafa as string).localeCompare(b.wafa as string, undefined, { numeric: true })
    );

  const renderDetailItem = (siswa: ChartDataItem['detail'][0], idx: number) => {
    const wafaSiswa = siswa as WafaDetailItem;
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
            Halaman: <b>{wafaSiswa.completedPages || 0}</b> / {wafaSiswa.totalPages ?? '-'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <ChartCard
      title="Progres Tahsin Wafa Siswa"
      description="Progres kumulatif tahsin Wafa berdasarkan total halaman yang sudah ditashih (per range halaman)"
      data={chartData}
      xAxisKey="wafa"
      isLoading={isLoading}
      error={error}
      renderDetailItem={renderDetailItem}
    />
  );
}
