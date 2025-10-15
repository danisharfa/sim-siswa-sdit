'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { User, School } from 'lucide-react';
import useSWR from 'swr';

interface CoordinatorInfo {
  id: string;
  name: string;
  nip: string;
}

interface CoordinatorInfoResponse {
  coordinatorInfo: CoordinatorInfo;
  currentPeriod: {
    academicYear: string;
    semester: string;
    label: string;
  };
}

type ApiResponse = {
  success: boolean;
  data?: CoordinatorInfoResponse;
  error?: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function CoordinatorInfoCard() {
  const {
    data: response,
    error,
    isLoading,
  } = useSWR<ApiResponse>('/api/coordinator/info', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 0,
  });

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Info Koordinator</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Info Koordinator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!response?.success || !response.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Info Koordinator</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {response?.error || 'Tidak dapat memuat info koordinator.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const { coordinatorInfo, currentPeriod } = response.data;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <User />
          Info Koordinator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-muted-foreground">Nama</span>
            <span className="font-medium">{coordinatorInfo.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium text-muted-foreground">NIP</span>
            <span className="font-medium">{coordinatorInfo.nip}</span>
          </div>
        </div>

        <div className="border-t pt-3 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <School className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Periode Saat Ini</span>
          </div>
          <div className="pl-6">
            <div className="font-medium">{currentPeriod.label}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
