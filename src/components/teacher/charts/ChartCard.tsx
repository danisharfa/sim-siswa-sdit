'use client';

import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';

export type ChartDataItem = {
  [key: string]: string | number | unknown[] | unknown;
  selesai: number;
  proses: number;
  belumDimulai: number;
  detail: {
    studentName: string;
    percent: number;
    status: 'SELESAI' | 'SEDANG_DIJALANI' | 'BELUM_DIMULAI';
    [key: string]: unknown;
  }[];
};

const chartConfig = {
  selesai: {
    label: 'Selesai',
    color: 'var(--chart-1)',
  },
  proses: {
    label: 'Sedang Dijalani',
    color: 'var(--chart-2)',
  },
  belumDimulai: {
    label: 'Belum Dimulai',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig;

type ChartCardProps = {
  title: string;
  description: string;
  data: ChartDataItem[];
  xAxisKey: string;
  isLoading?: boolean;
  error?: Error | null;
  onBarClick?: (item: ChartDataItem) => void;
  renderDetailItem?: (item: ChartDataItem['detail'][0], index: number) => React.ReactNode;
};

export function ChartCard({
  title,
  description,
  data,
  xAxisKey,
  isLoading = false,
  error = null,
  onBarClick,
  renderDetailItem,
}: ChartCardProps) {
  const [selectedItem, setSelectedItem] = useState<ChartDataItem | null>(null);
  const [dataFilter, setDataFilter] = useState<'all' | 'active'>('all');

  if (isLoading)
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  if (error) return <p className="text-destructive">Gagal memuat chart.</p>;

  const filteredData =
    dataFilter === 'all' ? data : data.filter((item) => item.selesai + item.proses > 0);

  const handleBarClick = (e: unknown) => {
    const active = (e as { activePayload?: { payload: ChartDataItem }[] })?.activePayload?.[0]
      ?.payload;
    if (active) {
      setSelectedItem(active);
      onBarClick?.(active);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'SEDANG_DIJALANI':
        return 'Sedang Dijalani';
      case 'SELESAI':
        return 'Selesai';
      case 'BELUM_DIMULAI':
        return 'Belum Dimulai';
      default:
        return status;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={dataFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDataFilter('all')}
                className="text-xs"
              >
                Semua Data
              </Button>
              <Button
                variant={dataFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDataFilter('active')}
                className="text-xs"
              >
                Sedang Dijalani
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="aspect-auto h-[200px]">
            <BarChart data={filteredData} onClick={handleBarClick}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey={xAxisKey} tickLine={false} tickMargin={10} axisLine={false} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                allowDecimals={false}
                label={{ value: 'Jumlah Siswa', angle: -90, position: 'insideBottomLeft' }}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
              <Bar dataKey="selesai" fill={chartConfig.selesai.color} radius={4} />
              <Bar dataKey="proses" fill={chartConfig.proses.color} radius={4} />
              <Bar dataKey="belumDimulai" fill={chartConfig.belumDimulai.color} radius={4} />
              <ChartLegend content={<ChartLegendContent />} />
            </BarChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="flex gap-2 font-medium leading-none">
            Klik pada bar untuk melihat daftar siswa
          </div>
          <div className="leading-none text-muted-foreground">
            {`Menampilkan ${filteredData.length} dari ${data.length} item`}
            {dataFilter === 'active' && ' (hanya yang ada progress)'}
          </div>
        </CardFooter>
      </Card>

      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detail Siswa</DialogTitle>
            <DialogDescription>{String(selectedItem?.[xAxisKey] || '')}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[300px] overflow-y-auto space-y-2 text-sm">
            {selectedItem?.detail.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Tidak ada data siswa</p>
            ) : (
              selectedItem?.detail.map((siswa, idx) => (
                <div key={idx}>
                  {renderDetailItem ? (
                    renderDetailItem(siswa, idx)
                  ) : (
                    <div className="flex flex-col border-b pb-2 gap-1">
                      <div className="flex justify-between">
                        <span>
                          {siswa.studentName}{' '}
                          <span className="text-muted-foreground">
                            ({getStatusLabel(siswa.status)})
                          </span>
                        </span>
                        <span className="font-medium">{siswa.percent}%</span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
