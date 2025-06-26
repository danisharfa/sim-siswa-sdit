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
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
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

export type ReportItem = {
  subject: 'Tahsin' | 'Tahfidz';
  topic: string;
  scoreNumeric: number;
  scoreLetter: string;
  description: string;
};

interface Props {
  data: StudentReportData;
  title: string;
}

const fetchSetting = async () => {
  const res = await fetch('/api/academicSetting');
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
};

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

  const { data: setting } = useSWR('/api/academicSetting', fetchSetting);

  // Debug logs
  console.log('Report data:', data);
  console.log('All reports:', data.allReports);

  const academicPeriods = useMemo(() => {
    const periods = data.allReports.map((r) => `${r.period.academicYear}-${r.period.semester}`);
    console.log('Mapped periods:', periods);
    return periods;
  }, [data.allReports]);

  const defaultPeriod = setting ? `${setting.currentYear}-${setting.currentSemester}` : 'all';

  useEffect(() => {
    console.log('Default period:', defaultPeriod);
    console.log('Available periods:', academicPeriods);

    if (defaultPeriod !== 'all' && academicPeriods.includes(defaultPeriod)) {
      setSelectedPeriod(defaultPeriod);
    } else if (academicPeriods.length > 0) {
      setSelectedPeriod(academicPeriods[0]);
    }
  }, [defaultPeriod, academicPeriods]);

  // Get current period data
  const currentPeriodData = useMemo(() => {
    if (selectedPeriod === 'all') {
      return data.allReports[0] || null;
    }

    const [academicYear, semester] = selectedPeriod.split('-');
    const foundData = data.allReports.find(
      (report) => report.period.academicYear === academicYear && report.period.semester === semester
    );
    console.log('Current period data:', foundData);
    return foundData || null;
  }, [selectedPeriod, data.allReports]);

  // Transform the data to flatten tahsin and tahfidz scores
  const tableData = useMemo<ReportItem[]>(() => {
    if (!currentPeriodData) return [];

    const tahsinItems: ReportItem[] = currentPeriodData.tahsin.map((item) => ({
      subject: 'Tahsin' as const,
      topic: item.topic,
      scoreNumeric: item.scoreNumeric,
      scoreLetter: item.scoreLetter,
      description: item.description,
    }));

    const tahfidzItems: ReportItem[] = currentPeriodData.tahfidz.map((item) => ({
      subject: 'Tahfidz' as const,
      topic: item.surahName,
      scoreNumeric: item.scoreNumeric,
      scoreLetter: item.scoreLetter,
      description: item.description,
    }));

    return [...tahsinItems, ...tahfidzItems];
  }, [currentPeriodData]);

  const columns = useMemo<ColumnDef<ReportItem>[]>(
    () => [
      {
        accessorKey: 'subject',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Mata Pelajaran" />,
        cell: ({ row }) => (
          <Badge variant={row.original.subject === 'Tahfidz' ? 'default' : 'secondary'}>
            {row.original.subject}
          </Badge>
        ),
      },
      {
        accessorKey: 'topic',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Materi" />,
        cell: ({ row }) => <div className="font-medium">{row.original.topic}</div>,
      },
      {
        accessorKey: 'scoreNumeric',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nilai" />,
        cell: ({ row }) => (
          <div className="text-center font-medium">{row.original.scoreNumeric}</div>
        ),
      },
      {
        accessorKey: 'scoreLetter',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Predikat" />,
        cell: ({ row }) => {
          const grade = row.original.scoreLetter;
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
        header: 'Deskripsi',
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.description === '-' ? '-' : row.original.description}
          </span>
        ),
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

  // Show loading state while data is being fetched
  if (!data || !data.allReports) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">Memuat data rapor...</p>
      </div>
    );
  }

  // Show message if no academic periods found
  if (academicPeriods.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">Tidak ada data periode akademik ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Period Filter and Export */}
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <Label className="mb-2 block">Filter Tahun Ajaran</Label>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="min-w-[200px]">
              <SelectValue placeholder="Pilih Tahun Ajaran" />
            </SelectTrigger>
            <SelectContent>
              {academicPeriods.map((period) => {
                const periodData = data.allReports.find(
                  (r) => `${r.period.academicYear}-${r.period.semester}` === period
                );
                return (
                  <SelectItem key={period} value={period}>
                    {period.replace('-', ' ')} - {periodData?.period.className}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Export PDF Button */}
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
              }-${data.fullName.replace(/\s+/g, '_')}.pdf`}
            >
              {({ loading }) => (
                <Button disabled={loading} variant="outline">
                  {loading ? 'Menyiapkan PDF...' : 'Export PDF'}
                </Button>
              )}
            </PDFDownloadLink>
          </div>
        )}
      </div>

      {/* Student Info Header */}
      {currentPeriodData && (
        <div className="rounded-lg border bg-card p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">Kelas:</span>
              <p className="font-medium">{currentPeriodData.period.className}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Guru:</span>
              <p className="font-medium">{currentPeriodData.period.teacherName}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Periode:</span>
              <p className="font-medium">
                {currentPeriodData.period.academicYear} {currentPeriodData.period.semester}
              </p>
            </div>
          </div>

          {/* Summary Scores */}
          {(currentPeriodData.report.tahfidzScore || currentPeriodData.report.tahsinScore) && (
            <div className="mt-4 pt-4 border-t">
              <h3 className="font-medium mb-2">Ringkasan Nilai</h3>
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

      {/* Data Table */}
      {currentPeriodData && tableData.length > 0 ? (
        <DataTable title={title} table={table} filterColumn="topic" />
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
