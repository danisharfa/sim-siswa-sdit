'use client';

import { useState, useEffect } from 'react';
import { ReportTable } from '@/components/student/report/ReportTable';
import { StudentReportData } from '@/lib/data/student/report';
import { AssessmentPeriod } from '@prisma/client';

export function ReportManagement() {
  const [period, setPeriod] = useState<AssessmentPeriod>('FINAL');
  const [data, setData] = useState<StudentReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/student/report?period=${period}`);
        if (!response.ok) {
          throw new Error('Failed to fetch report data');
        }
        const reportData = await response.json();
        setData(reportData);
      } catch (error) {
        console.error('Failed to fetch report data:', error);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [period]);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4">
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">Gagal memuat data rapor</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <ReportTable data={data} title="Detail Nilai" period={period} onPeriodChange={setPeriod} />
    </div>
  );
}
