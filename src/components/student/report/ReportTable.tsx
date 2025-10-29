'use client';

import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { useDataTableState } from '@/lib/hooks/use-data-table';
import { StudentReportData } from '@/lib/data/student/report';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ExportPdf } from './ExportPdf';
import { Download } from 'lucide-react';

export type ReportItem = {
  subject: 'Tahsin' | 'Tahfidz';
  topic: string;
  score: number;
  grade: string;
  description: string;
};

interface Props {
  data: StudentReportData;
  title: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ReportTable({ data, title }: Props) {
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
  } = useDataTableState<ReportItem, string>();

  const [selectedPeriod, setSelectedPeriod] = useState('all');

  const { data: setting } = useSWR('/api/academicSetting', fetcher);

  const academicPeriods = useMemo(() => {
    const periods = data.allReports.map((r) => `${r.period.academicYear}-${r.period.semester}`);
    return periods;
  }, [data.allReports]);

  const defaultPeriod = setting ? `${setting.currentYear}-${setting.currentSemester}` : 'all';

  useEffect(() => {
    if (defaultPeriod !== 'all' && academicPeriods.includes(defaultPeriod)) {
      setSelectedPeriod(defaultPeriod);
    } else if (academicPeriods.length > 0) {
      setSelectedPeriod(academicPeriods[0]);
    }
  }, [defaultPeriod, academicPeriods]);

  const currentPeriodData = useMemo(() => {
    if (selectedPeriod === 'all') {
      return data.allReports[0] || null;
    }

    const [academicYear, semester] = selectedPeriod.split('-');
    const foundData = data.allReports.find(
      (report) => report.period.academicYear === academicYear && report.period.semester === semester
    );
    return foundData || null;
  }, [selectedPeriod, data.allReports]);

  const tableData = useMemo<ReportItem[]>(() => {
    if (!currentPeriodData) return [];

    const tahsinItems: ReportItem[] = currentPeriodData.tahsin.map((item) => ({
      subject: 'Tahsin' as const,
      topic: item.topic,
      score: item.score,
      grade: item.grade,
      description: item.description,
    }));

    const tahfidzItems: ReportItem[] = currentPeriodData.tahfidz.map((item) => ({
      subject: 'Tahfidz' as const,
      topic: item.surahName,
      score: item.score,
      grade: item.grade,
      description: item.description,
    }));

    return [...tahsinItems, ...tahfidzItems];
  }, [currentPeriodData]);

  const columns = useMemo<ColumnDef<ReportItem>[]>(
    () => [
      {
        accessorKey: 'subject',
        id: 'Mata Pelajaran',
        header: 'Mata Pelajaran',
        cell: ({ row }) => (
          <Badge variant={row.original.subject === 'Tahfidz' ? 'default' : 'secondary'}>
            {row.original.subject}
          </Badge>
        ),
      },
      {
        accessorKey: 'topic',
        id: 'Materi',
        header: 'Materi',
      },
      {
        accessorKey: 'score',
        id: 'Nilai',
        header: 'Nilai',
      },
      {
        accessorKey: 'grade',
        id: 'Predikat',
        header: 'Predikat',
        cell: ({ row }) => {
          const grade = row.original.grade;
          const variant =
            grade === 'A'
              ? 'default'
              : grade === 'B'
              ? 'secondary'
              : grade === 'C'
              ? 'outline'
              : 'destructive';

          return (
            <Badge variant={variant} className="text-center">
              {grade}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'description',
        id: 'Deskripsi',
        header: 'Deskripsi',
      },
    ],
    []
  );

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (!data || !data.allReports) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">Memuat data rapor...</p>
      </div>
    );
  }

  if (academicPeriods.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">Tidak ada data tahun akademik ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <Label className="mb-2 block sr-only">Filter Tahun Akademik</Label>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="min-w-[200px]">
              <SelectValue placeholder="Pilih Tahun Akademik" />
            </SelectTrigger>
            <SelectContent>
              {academicPeriods.map((period) => {
                data.allReports.find(
                  (r) => `${r.period.academicYear}-${r.period.semester}` === period
                );
                return (
                  <SelectItem key={period} value={period}>
                    {period.replace('-', ' ')}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Student Info Header */}
      {currentPeriodData && (
        <div className="rounded-lg border bg-card p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">Tahun Akademik:</span>
              <p className="font-medium">
                {currentPeriodData.period.academicYear} {currentPeriodData.period.semester}
              </p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Kelas:</span>
              <p className="font-medium">{currentPeriodData.period.className}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Kelompok:</span>
              <p className="font-medium">{currentPeriodData.period.groupName}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Guru Pembimbing:</span>
              <p className="font-medium">{currentPeriodData.period.teacherName}</p>
            </div>
          </div>

          {/* Summary Scores */}
          {(currentPeriodData.report.tahfidzScore || currentPeriodData.report.tahsinScore) && (
            <div className="mt-4 pt-4 border-t">
              <h3 className="font-medium mb-2">Ringkasan Nilai - Akhir Semester</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {currentPeriodData.report.tahfidzScore && (
                  <div>
                    <span className="text-muted-foreground">Rata-rata Tahfidz:</span>
                    <p className="font-medium text-lg">
                      {currentPeriodData.report.tahfidzScore.toFixed(1)}
                    </p>
                  </div>
                )}
                {currentPeriodData.report.tahsinScore && (
                  <div>
                    <span className="text-muted-foreground">Rata-rata Tahsin:</span>
                    <p className="font-medium text-lg">
                      {currentPeriodData.report.tahsinScore.toFixed(1)}
                    </p>
                  </div>
                )}
                {currentPeriodData.report.lastTahsinMaterial && (
                  <div>
                    <span className="text-muted-foreground">Materi Tahsin Terakhir:</span>
                    <p className="font-medium">{currentPeriodData.report.lastTahsinMaterial}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end mb-4">
        {currentPeriodData && (
          <div>
            <PDFDownloadLink
              document={
                <ExportPdf
                  data={data}
                  selectedPeriodIndex={data.allReports.findIndex(
                    (r) =>
                      r.period.academicYear === currentPeriodData.period.academicYear &&
                      r.period.semester === currentPeriodData.period.semester
                  )}
                />
              }
              fileName={`Rapor-${currentPeriodData.period.academicYear}-${
                currentPeriodData.period.semester
              }-Akhir-${data.fullName.replace(/\s+/g, '_')}.pdf`}
            >
              {({ loading }) => (
                <Button disabled={loading} variant="outline">
                  <Download className="mr-2" /> {loading ? 'Menyetak...' : 'Export PDF'}
                </Button>
              )}
            </PDFDownloadLink>
          </div>
        )}
      </div>

      {/* Data Table */}
      {currentPeriodData && tableData.length > 0 ? (
        <DataTable title={title} table={table} showColumnFilter={false} />
      ) : (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            {!currentPeriodData
              ? 'Pilih periode untuk melihat data rapor'
              : 'Tidak ada data rapor untuk periode ini'}
          </p>
        </div>
      )}
    </div>
  );
}
