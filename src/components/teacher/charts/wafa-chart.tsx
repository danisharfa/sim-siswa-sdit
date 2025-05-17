'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { TrendingUp } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type WafaResponse = {
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
    status: 'SELESAI' | 'SEDANG_DIJALANI';
  }[];
}[];

type ChartData = {
  wafa: string;
  selesai: number;
  proses: number;
  detail: {
    studentName: string;
    percent: number;
    status: 'SELESAI' | 'SEDANG_DIJALANI';
    completedPages: number;
    totalPages: number | null;
  }[];
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const chartConfig = {
  selesai: {
    label: 'Selesai',
    color: 'var(--chart-1)',
  },
  proses: {
    label: 'Sedang Dijalani',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

export function WafaChart() {
  const { data, isLoading, error } = useSWR<WafaResponse>('/api/teacher/chart/wafa', fetcher);
  const [selectedWafa, setSelectedWafa] = useState<ChartData | null>(null);

  if (isLoading) return <p className="text-muted-foreground">Memuat data chart...</p>;
  if (error) return <p className="text-destructive">Gagal memuat chart.</p>;

  const countMap: Record<number, Omit<ChartData, 'wafa'>> = {};

  data?.forEach((student) => {
    student.progress.forEach((p) => {
      if (!countMap[p.wafaId]) {
        countMap[p.wafaId] = { selesai: 0, proses: 0, detail: [] };
      }
      if (p.status === 'SELESAI') {
        countMap[p.wafaId].selesai += 1;
      } else {
        countMap[p.wafaId].proses += 1;
      }
      // ...existing code...
      countMap[p.wafaId].detail.push({
        studentName: student.studentName,
        percent: p.percent,
        status: p.status,
        completedPages: p.completedPages,
        totalPages: p.totalPages,
      });
      // ...existing code...
    });
  });

  const chartData: ChartData[] = Object.entries(countMap)
    .map(([wafaId, value]) => ({
      wafa:
        data?.flatMap((s) => s.progress).find((p) => String(p.wafaId) === wafaId)?.wafaName ??
        `Wafa ${wafaId}`,
      ...value,
    }))
    .sort((a, b) => a.wafa.localeCompare(b.wafa, undefined, { numeric: true }));

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Progres Tahsin (Wafa)</CardTitle>
          <CardDescription>Siswa bimbingan berdasarkan status setoran Wafa</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <BarChart
              data={chartData}
              onClick={(e) => {
                const active = e?.activePayload?.[0]?.payload as ChartData;
                if (active) setSelectedWafa(active);
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis dataKey="wafa" tickLine={false} tickMargin={10} axisLine={false} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
              <Bar dataKey="selesai" fill={chartConfig.selesai.color} radius={4} />
              <Bar dataKey="proses" fill={chartConfig.proses.color} radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="flex gap-2 font-medium leading-none">
            Klik pada bar untuk melihat daftar siswa <TrendingUp className="h-4 w-4" />
          </div>
          <div className="leading-none text-muted-foreground">
            Menampilkan progres per buku Wafa
          </div>
        </CardFooter>
      </Card>

      {/* Dialog daftar siswa */}
      <Dialog open={!!selectedWafa} onOpenChange={() => setSelectedWafa(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detail Siswa - {selectedWafa?.wafa}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[300px] overflow-y-auto space-y-2 text-sm">
            {selectedWafa?.detail.map((siswa, idx) => (
              <div key={idx} className="flex flex-col border-b pb-2 gap-1">
                <div className="flex justify-between">
                  <span>
                    {siswa.studentName}{' '}
                    <span className="text-muted-foreground">({siswa.status})</span>
                  </span>
                  <span className="font-medium">{siswa.percent}%</span>
                </div>
                <div className="text-xs text-muted-foreground flex gap-2">
                  <span>
                    Halaman: <b>{siswa.completedPages}</b> / {siswa.totalPages ?? '-'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
