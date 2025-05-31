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
    status: 'SELESAI' | 'SEDANG_DIJALANI';
  }[];
}[];

type ChartData = {
  juz: string;
  selesai: number;
  proses: number;
  detail: {
    studentName: string;
    percent: number;
    status: 'SELESAI' | 'SEDANG_DIJALANI';
    completedSurah: number;
    totalSurah: number | null;
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

export function AlquranChart() {
  const { data, isLoading, error } = useSWR<ChartResponse>('/api/teacher/chart/alquran', fetcher);
  const [selectedJuz, setSelectedJuz] = useState<ChartData | null>(null);

  if (isLoading) return <p className="text-muted-foreground">Memuat data chart...</p>;
  if (error) return <p className="text-destructive">Gagal memuat chart.</p>;

  const countMap: Record<number, Omit<ChartData, 'juz'>> = {};

  data?.forEach((student) => {
    student.progress.forEach((p) => {
      if (!countMap[p.juzId]) {
        countMap[p.juzId] = { selesai: 0, proses: 0, detail: [] };
      }
      if (p.status === 'SELESAI') {
        countMap[p.juzId].selesai += 1;
      } else {
        countMap[p.juzId].proses += 1;
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

  const chartData: ChartData[] = Object.entries(countMap)
    .map(([juzId, value]) => ({
      juz: `Juz ${juzId}`,
      ...value,
    }))
    .sort((a, b) => Number(b.juz.replace('Juz ', '')) - Number(a.juz.replace('Juz ', '')));

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Progres Hafalan per Juz</CardTitle>
          <CardDescription>Siswa bimbingan berdasarkan status setoran</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <BarChart
              data={chartData}
              onClick={(e) => {
                const active = e?.activePayload?.[0]?.payload as ChartData;
                if (active) setSelectedJuz(active);
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis dataKey="juz" tickLine={false} tickMargin={10} axisLine={false} />
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
            Menampilkan total progres hafalan siswa berdasarkan juz
          </div>
        </CardFooter>
      </Card>

      {/* Dialog daftar siswa */}
      <Dialog open={!!selectedJuz} onOpenChange={() => setSelectedJuz(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detail Siswa - {selectedJuz?.juz}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[300px] overflow-y-auto space-y-2 text-sm">
            {selectedJuz?.detail.map((siswa, idx) => (
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
                    Surah: <b>{siswa.completedSurah}</b> / {siswa.totalSurah ?? '-'}
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
