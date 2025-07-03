'use client';

import { useMemo, useState } from 'react';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { useDataTableState } from '@/lib/hooks/use-data-table';
import { DataTable } from '@/components/ui/data-table';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Semester, MunaqasyahBatch } from '@prisma/client';

interface MunaqasyahResult {
  id: string;
  score: number;
  grade: string; // Changed to string to support MunaqasyahGrade enum values
  passed: boolean;
  academicYear: string;
  semester: Semester;
  classroomName: string;
  groupName: string;
  batch: MunaqasyahBatch;
  stage: string; // Changed to string to support MunaqasyahStage enum values
  juz: { name: string };
  schedule: {
    date: string;
    sessionName: string;
    startTime: string;
    endTime: string;
    location: string;
  };
  student: {
    nis: string;
    user: { fullName: string };
  };
  scoreDetails?: {
    tasmi?: {
      tajwid: number;
      kelancaran: number;
      adab: number;
      note?: string;
      totalScore: number;
    } | null;
    munaqasyah?: {
      tajwid: number;
      kelancaran: number;
      adab: number;
      note?: string;
      totalScore: number;
    } | null;
  };
  // Add final result data if this result is part of a completed final result
  finalResult?: {
    finalScore: number;
    finalGrade: string;
    passed: boolean;
  } | null;
}

interface MunaqasyahResultTableProps {
  data: MunaqasyahResult[];
  title: string;
}

const gradeLabels: Record<string, string> = {
  MUMTAZ: 'Mumtaz',
  JAYYID_JIDDAN: 'Jayyid Jiddan',
  JAYYID: 'Jayyid',
  TIDAK_LULUS: 'Tidak Lulus',
};

const stageLabels: Record<string, string> = {
  TASMI: 'Tasmi',
  MUNAQASYAH: 'Munaqasyah',
};

const batchLabels: Record<MunaqasyahBatch, string> = {
  [MunaqasyahBatch.TAHAP_1]: 'Tahap 1',
  [MunaqasyahBatch.TAHAP_2]: 'Tahap 2',
  [MunaqasyahBatch.TAHAP_3]: 'Tahap 3',
  [MunaqasyahBatch.TAHAP_4]: 'Tahap 4',
};

export function MunaqasyahResultTable({ data, title }: MunaqasyahResultTableProps) {
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
  } = useDataTableState<MunaqasyahResult, string>();

  const [selectedYearSemester, setSelectedYearSemester] = useState<string | 'ALL'>('ALL');

  const columns = useMemo<ColumnDef<MunaqasyahResult>[]>(
    () => [
      {
        id: 'Tanggal',
        header: 'Tanggal',
        cell: ({ row }) => {
          const s = row.original.schedule;
          const date = new Date(s.date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });
          return (
            <div className="text-sm">
              <div className="font-medium">{date}</div>
              <div className="text-muted-foreground">
                {s.sessionName} ({s.startTime} - {s.endTime})
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'schedule.location',
        id: 'Lokasi',
        header: 'Lokasi',
      },
      {
        id: 'Siswa',
        header: 'Siswa',
        accessorFn: (row) => row.student.user.fullName,
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">{row.original.student.user.fullName}</div>
            <div className="text-muted-foreground">{row.original.student.nis}</div>
          </div>
        ),
      },
      {
        id: 'Tahun Ajaran',
        header: 'Tahun Ajaran',
        accessorFn: (row) => `${row.academicYear} ${row.semester}`,
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">
              {row.original.academicYear} {row.original.semester}
            </div>
            <div className="text-muted-foreground">
              {row.original.groupName} - {row.original.classroomName}
            </div>
          </div>
        ),
      },
      {
        id: 'Juz',
        header: 'Juz',
        cell: ({ row }) => <Badge variant="outline">{row.original.juz.name}</Badge>,
      },
      {
        id: 'Batch',
        header: 'Batch',
        cell: ({ row }) => <Badge variant="secondary">{batchLabels[row.original.batch]}</Badge>,
      },
      {
        id: 'Tahap',
        header: 'Tahap',
        cell: ({ row }) => <Badge variant="default">{stageLabels[row.original.stage]}</Badge>,
      },
      {
        id: 'Nilai',
        header: 'Nilai',
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">
              {row.original.score.toFixed(1)} (
              {gradeLabels[row.original.grade] || row.original.grade})
            </div>
            {row.original.scoreDetails && (
              <div className="text-xs text-muted-foreground space-y-1">
                {row.original.scoreDetails.tasmi && (
                  <div>Tasmi: {row.original.scoreDetails.tasmi.totalScore.toFixed(1)}</div>
                )}
                {row.original.scoreDetails.munaqasyah && (
                  <div>
                    Munaqasyah: {row.original.scoreDetails.munaqasyah.totalScore.toFixed(1)}
                  </div>
                )}
              </div>
            )}
          </div>
        ),
      },
      {
        id: 'Status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={
              row.original.passed
                ? 'text-green-600 border-green-600'
                : 'text-red-600 border-red-600'
            }
          >
            {row.original.passed ? 'Lulus' : 'Tidak Lulus'}
          </Badge>
        ),
      },
      {
        id: 'Nilai Final',
        header: 'Nilai Final',
        cell: ({ row }) => {
          const finalResult = row.original.finalResult;
          if (!finalResult) {
            return <div className="text-xs text-muted-foreground">Belum ada hasil final</div>;
          }

          return (
            <div className="text-sm">
              <div className="font-bold text-base">{finalResult.finalScore.toFixed(1)}</div>
              <div className="font-medium text-primary text-xs">
                {gradeLabels[finalResult.finalGrade] || finalResult.finalGrade}
              </div>
              <Badge
                variant={finalResult.passed ? 'default' : 'destructive'}
                className="text-xs mt-1"
              >
                {finalResult.passed ? '✅ LULUS' : '❌ TIDAK LULUS'}
              </Badge>
            </div>
          );
        },
      },
      {
        id: 'Detail',
        header: 'Detail',
        cell: ({ row }) => {
          const { scoreDetails } = row.original;
          if (!scoreDetails) return '-';

          return (
            <div className="text-xs space-y-1">
              {scoreDetails.tasmi && (
                <div className="space-y-0.5">
                  <div className="font-medium">Tasmi:</div>
                  <div>Tajwid: {scoreDetails.tasmi.tajwid}</div>
                  <div>Kelancaran: {scoreDetails.tasmi.kelancaran}</div>
                  <div>Adab: {scoreDetails.tasmi.adab}</div>
                  {scoreDetails.tasmi.note && (
                    <div className="text-muted-foreground">Catatan: {scoreDetails.tasmi.note}</div>
                  )}
                </div>
              )}
              {scoreDetails.munaqasyah && (
                <div className="space-y-0.5">
                  <div className="font-medium">Munaqasyah:</div>
                  <div>Tajwid: {scoreDetails.munaqasyah.tajwid}</div>
                  <div>Kelancaran: {scoreDetails.munaqasyah.kelancaran}</div>
                  <div>Adab: {scoreDetails.munaqasyah.adab}</div>
                  {scoreDetails.munaqasyah.note && (
                    <div className="text-muted-foreground">
                      Catatan: {scoreDetails.munaqasyah.note}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  const yearSemesterOptions = useMemo(() => {
    const set = new Set<string>();
    for (const d of data) {
      set.add(`${d.academicYear}__${d.semester}`);
    }
    return Array.from(set);
  }, [data]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
  });

  return (
    <>
      <div className="mb-4">
        <Label className="mb-2 block">Filter Tahun Ajaran</Label>
        <Select
          value={selectedYearSemester}
          onValueChange={(value) => {
            setSelectedYearSemester(value);
            table
              .getColumn('Tahun Ajaran')
              ?.setFilterValue(value === 'ALL' ? undefined : value.replace('__', ' '));
          }}
        >
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Pilih Tahun Ajaran" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua</SelectItem>
            {yearSemesterOptions.map((val) => {
              const [year, sem] = val.split('__');
              return (
                <SelectItem key={val} value={val}>
                  {year} {sem}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <DataTable title={title} table={table} filterColumn="Siswa" />
    </>
  );
}
