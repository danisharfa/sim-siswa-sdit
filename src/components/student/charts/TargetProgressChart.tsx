'use client';

import { Calendar } from 'lucide-react';
import { Label, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart } from 'recharts';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer } from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { TodayTargetData } from './TodayTargets';
import { SubmissionType, TargetStatus } from '@prisma/client';

interface TargetProgressChartProps {
  target: TodayTargetData;
}

function formatTargetType(type: SubmissionType): string {
  switch (type) {
    case 'TAHFIDZ':
      return 'Tahfidz';
    case 'TAHSIN_WAFA':
      return 'Tahsin Wafa';
    case 'TAHSIN_ALQURAN':
      return 'Tahsin Al-Quran';
    default:
      return type;
  }
}

function formatTargetStatus(status: TargetStatus): {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
} {
  switch (status) {
    case 'TERCAPAI':
      return { label: 'Tercapai', variant: 'default' as const };
    case 'TIDAK_TERCAPAI':
      return { label: 'Belum Tercapai', variant: 'destructive' as const };
    default:
      return { label: status, variant: 'outline' as const };
  }
}

function formatTargetDescription(target: TodayTargetData): string {
  if (target.type === 'TAHFIDZ' || target.type === 'TAHSIN_ALQURAN') {
    if (target.surahStart && target.surahEnd) {
      if (target.surahStart.id === target.surahEnd.id) {
        // Satu surah saja
        const startAyat = target.startAyat || 1;
        const endAyat = target.endAyat || 'akhir';
        return `${target.surahStart.name} (Ayat ${startAyat}-${endAyat})`;
      } else {
        // Multiple surah - format yang lebih descriptive
        const startAyat = target.startAyat || 1;
        const endAyat = target.endAyat || 'akhir';
        
        // Format: "Al-Ikhlas (1) - An-Nas (6)" untuk lebih jelas
        return `${target.surahStart.name} (${startAyat}) - ${target.surahEnd.name} (${endAyat})`;
      }
    }
  } else if (target.type === 'TAHSIN_WAFA' && target.wafa) {
    const startPage = target.startPage || 1;
    const endPage = target.endPage || 'akhir';
    
    if (startPage === endPage) {
      return `${target.wafa.name} hal. ${startPage}`;
    } else {
      return `${target.wafa.name} hal. ${startPage}-${endPage}`;
    }
  }

  return target.description;
}

function getProgressColor(
  progressPercent: number,
  status: TargetStatus,
  isExpiringSoon: boolean
): string {
  // Jika target sudah tercapai, gunakan warna hijau (SELESAI)
  if (status === 'TERCAPAI') {
    return 'rgb(34 197 94)'; // green-500 (sama dengan bg-green-500)
  }

  // Jika target expiring soon, gunakan warna orange
  if (isExpiringSoon) {
    return 'hsl(24 95% 53%)'; // orange
  }

  // Jika ada progress (> 0%), gunakan warna biru (SEDANG_DIJALANI)
  if (progressPercent > 0) {
    return 'rgb(59 130 246)'; // blue-500 (sama dengan bg-blue-500)
  }

  // Jika belum ada progress, gunakan warna abu-abu (BELUM_DIMULAI)
  return 'rgb(209 213 219)'; // gray-300 (sama dengan bg-gray-300)
}

export function TargetProgressChart({ target }: TargetProgressChartProps) {
  const statusInfo = formatTargetStatus(target.status);
  const isExpiringSoon = target.daysRemaining <= 2 && target.daysRemaining == 0;

  const progressColor = getProgressColor(
    target.progressPercent,
    target.status,
    isExpiringSoon
  );

  const chartData = [
    {
      target: 'progress',
      progress: target.progressPercent,
      fill: progressColor,
    },
  ];

  const chartConfig = {
    progress: {
      label: 'Progress',
    },
    target: {
      label: 'Target',
      color: progressColor,
    },
  } satisfies ChartConfig;

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center">
        <div className="flex items-center justify-between w-full">
          <Badge variant="outline" className="text-xs">
            {formatTargetType(target.type)}
          </Badge>
          <Badge variant={statusInfo.variant} className="text-xs">
            {statusInfo.label}
          </Badge>
        </div>
        <CardTitle className="text-sm font-medium text-center leading-tight">
          {formatTargetDescription(target)}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[180px]">
          <RadialBarChart
            data={chartData}
            startAngle={90}
            endAngle={90 + (360 * target.progressPercent) / 100}
            innerRadius={60}
            outerRadius={80}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-muted last:fill-background"
              polarRadius={[66, 54]}
            />
            <RadialBar dataKey="progress" background cornerRadius={10} />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-2xl font-bold"
                        >
                          {target.progressPercent}%
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 16}
                          className="fill-muted-foreground text-xs"
                        >
                          Progress
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>

      <CardFooter className="flex-col gap-2 text-xs">
        <div className="flex items-center gap-2 leading-none">
          <Calendar className="h-3 w-3" />
          <span>
            {new Date(target.startDate).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
            })}{' '}
            -{' '}
            {new Date(target.endDate).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
            })}
          </span>
        </div>
        <div className="text-muted-foreground leading-none text-center">
          {isExpiringSoon
            ? `Berakhir dalam ${target.daysRemaining} hari`
            : `${target.daysRemaining} hari tersisa`}
        </div>
      </CardFooter>
    </Card>
  );
}
