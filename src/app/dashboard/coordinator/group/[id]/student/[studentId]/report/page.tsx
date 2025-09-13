'use client';

import { useState, useEffect, use } from 'react';
import { notFound } from 'next/navigation';
import { CoordinatorReportTable } from '@/components/coordinator/report/CoordinatorReportTable';
import { BackButton } from '@/components/ui/back-button';
import { AssessmentPeriod } from '@prisma/client';
import type { StudentReportData } from '@/lib/data/teacher/report';

type Params = Promise<{ id: string; studentId: string }>;

export default function ReportPage({ params }: { params: Params }) {
  const { id: groupId, studentId } = use(params);
  const [period, setPeriod] = useState<AssessmentPeriod>('FINAL');
  const [data, setData] = useState<StudentReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/coordinator/report/${studentId}?groupId=${groupId}&period=${period}`
        );
        if (!response.ok) {
          throw new Error('Data not found');
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
  }, [studentId, groupId, period]);

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center mb-4">
          <BackButton href={`/dashboard/coordinator/group/${groupId}`} />
          <h1 className="text-2xl font-bold ml-4">Rapor Al-Qur&apos;an</h1>
        </div>
        <div>Loading...</div>
      </div>
    );
  }

  if (!data) return notFound();

  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <BackButton href={`/dashboard/coordinator/group/${groupId}`} />
        <h1 className="text-2xl font-bold ml-4">Rapor Al-Qur&apos;an</h1>
      </div>

      <CoordinatorReportTable
        data={data}
        title="Detail Nilai"
        period={period}
        onPeriodChange={setPeriod}
      />
    </div>
  );
}
