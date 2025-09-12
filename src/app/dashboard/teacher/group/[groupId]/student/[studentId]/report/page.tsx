'use client';

import { useState, useEffect, use } from 'react';
import { notFound } from 'next/navigation';
import { StudentReportCard } from '@/components/teacher/report/StudentReportCard';
import { BackButton } from '@/components/ui/back-button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AssessmentPeriod } from '@prisma/client';
import type { StudentReportData } from '@/lib/data/teacher/report';

type Params = Promise<{ groupId: string; studentId: string }>;

export default function ReportPage({ params }: { params: Params }) {
  const { groupId, studentId } = use(params);
  const [period, setPeriod] = useState<AssessmentPeriod>('FINAL');
  const [data, setData] = useState<StudentReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/teacher/report/${studentId}?groupId=${groupId}&period=${period}`
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
          <BackButton href={`/dashboard/teacher/group/${groupId}`} />
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
        <BackButton href={`/dashboard/teacher/group/${groupId}`} />
        <h1 className="text-2xl font-bold ml-4">Rapor Al-Qur&apos;an</h1>
      </div>

      {/* Period Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Periode Rapor</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={period} onValueChange={(value: AssessmentPeriod) => setPeriod(value)}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Pilih Periode Rapor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MID_SEMESTER">Tengah Semester</SelectItem>
              <SelectItem value="FINAL">Akhir Semester</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <StudentReportCard data={data} />
    </div>
  );
}
