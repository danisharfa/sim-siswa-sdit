'use client';

import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { useMemo } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { useDataTableState } from '@/lib/hooks/use-data-table';
import { StudentReportData } from '@/lib/data/teacher/report';
import { StudentReportPdf } from '@/components/teacher/report/StudentReportPdf';
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

export function CoordinatorReportTable({ data, title }: Props) {
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
  } = useDataTableState<ReportItem, string>();

  const tableData = useMemo<ReportItem[]>(() => {
    const tahsinItems: ReportItem[] = data.tahsin.map((item) => ({
      subject: 'Tahsin' as const,
      topic: item.topic,
      score: item.score,
      grade: item.grade,
      description: item.description,
    }));

    const tahfidzItems: ReportItem[] = data.tahfidz.map((item) => ({
      subject: 'Tahfidz' as const,
      topic: item.surahName,
      score: item.score,
      grade: item.grade,
      description: item.description,
    }));

    return [...tahsinItems, ...tahfidzItems];
  }, [data]);

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

  // Get the scores from the simplified structure
  const currentTahsinScore = data.report.tahsinScore;
  const currentTahfidzScore = data.report.tahfidzScore;

  // helper functions
  const numberToRoman = (num: number): string => {
    const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    return roman[num - 1] ?? num.toString();
  };

  const semesterToLabel = (s: typeof data.semester): string => {
    return s === 'GANJIL' ? 'I (Satu)' : 'II (Dua)';
  };

  // Format class label
  const [classNumberRaw, classNameRaw] = data.className.split(' ');
  const classRoman = numberToRoman(parseInt(classNumberRaw));
  const classLabel = `${classRoman} - ${classNameRaw}`;
  const semesterLabel = semesterToLabel(data.semester);

  if (!data) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">Memuat data rapor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Student Info Header */}
      <div className="rounded-lg border bg-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium text-muted-foreground">Nama Siswa:</span>
            <p className="font-medium">{data.fullName}</p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">NIS / NISN:</span>
            <p className="font-medium">
              {data.nis} / {data.nisn}
            </p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Kelas:</span>
            <p className="font-medium">{classLabel}</p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Semester:</span>
            <p className="font-medium">{semesterLabel}</p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Tahun Akademik:</span>
            <p className="font-medium">
              {data.academicYear} {data.semester}
            </p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Guru Pembimbing:</span>
            <p className="font-medium">{data.teacherName}</p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Alamat:</span>
            <p className="font-medium">{data.address || '-'}</p>
          </div>
        </div>

        {/* Summary Scores */}
        {(currentTahfidzScore || currentTahsinScore || data.report.lastTahsinMaterial) && (
          <div className="mt-4 pt-4 border-t">
            <h3 className="font-medium mb-2">Ringkasan Nilai - Akhir Semester</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {currentTahfidzScore && (
                <div>
                  <span className="text-muted-foreground">Rata-rata Tahfidz:</span>
                  <p className="font-medium text-lg">{currentTahfidzScore.toFixed(1)}</p>
                </div>
              )}
              {currentTahsinScore && (
                <div>
                  <span className="text-muted-foreground">Rata-rata Tahsin:</span>
                  <p className="font-medium text-lg">{currentTahsinScore.toFixed(1)}</p>
                </div>
              )}
              {data.report.lastTahsinMaterial && (
                <div>
                  <span className="text-muted-foreground">Materi Tahsin Terakhir:</span>
                  <p className="font-medium">{data.report.lastTahsinMaterial}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end mb-4">
        <div>
          <PDFDownloadLink
            document={<StudentReportPdf data={data} />}
            fileName={`Rapor-${data.academicYear}-${data.semester}-Akhir-${data.fullName.replace(
              /\s+/g,
              '_'
            )}.pdf`}
          >
            {({ loading }) => (
              <Button disabled={loading} variant="outline">
                <Download className="mr-2" /> {loading ? 'Menyetak...' : 'Export PDF'}
              </Button>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      {/* Data Table */}
      {tableData.length > 0 ? (
        <DataTable title={title} table={table} showColumnFilter={false} />
      ) : (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">Tidak ada data rapor untuk periode ini</p>
        </div>
      )}
    </div>
  );
}
