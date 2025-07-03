'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SubmissionType, TargetStatus } from '@prisma/client';
import useSWR from 'swr';
import { TargetProgressChart } from './TargetProgressChart';

export interface TodayTargetData {
  id: string;
  type: SubmissionType;
  startDate: Date;
  endDate: Date;
  description: string;
  status: TargetStatus;
  progressPercent: number;
  surahStart?: {
    id: number;
    name: string;
  } | null;
  surahEnd?: {
    id: number;
    name: string;
  } | null;
  wafa?: {
    id: number;
    name: string;
  } | null;
  startAyat?: number | null;
  endAyat?: number | null;
  startPage?: number | null;
  endPage?: number | null;
  teacher: {
    name: string;
  };
  group: {
    name: string;
    className: string;
  };
  daysRemaining: number;
}

type ApiResponse = {
  success: boolean;
  data?: TodayTargetData[];
  error?: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function TodayTargets() {
  const {
    data: response,
    error,
    isLoading,
  } = useSWR<ApiResponse>('/api/student/today-targets', fetcher, {
    refreshInterval: 60000, // Refresh every minute
    revalidateOnFocus: true,
  });

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Target Pekan Ini</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Error: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Target Pekan Ini</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (!response?.success || !response.data || response.data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Target Pekan Ini</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {response?.error || 'Tidak ada target aktif untuk hari ini.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const targets = response.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Target Pekan Ini</span>
          <Badge variant="outline" className="text-xs">
            {targets.length} aktif
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {targets.map((target) => (
            <TargetProgressChart key={target.id} target={target} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
