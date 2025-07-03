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
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useDataTableState } from '@/lib/hooks/use-data-table';
import { DataTable } from '@/components/ui/data-table';
import { Semester, MunaqasyahBatch } from '@prisma/client';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';

interface MunaqasyahFinalResult {
  id: string;
  finalScore: number;
  finalGrade: string;
  passed: boolean;
  batch: MunaqasyahBatch;
  juz: { name: string };
  academicYear: string;
  semester: Semester;
  classroomName: string;
  groupName: string;
  createdAt: string;
  student: {
    nis: string;
    user: { fullName: string };
  };
  tasmiResult: {
    score: number;
    grade: string;
    passed: boolean;
    schedule: {
      date: string;
      sessionName: string;
      startTime: string;
      endTime: string;
      location: string;
    };
    scoreDetails: {
      tajwid: number;
      kelancaran: number;
      adab: number;
      note?: string;
      totalScore: number;
    } | null;
  };
  munaqasyahResult: {
    score: number;
    grade: string;
    passed: boolean;
    schedule: {
      date: string;
      sessionName: string;
      startTime: string;
      endTime: string;
      location: string;
    };
    scoreDetails: {
      tajwid: number;
      kelancaran: number;
      adab: number;
      note?: string;
      totalScore: number;
    } | null;
  };
}

interface Props {
  data: MunaqasyahFinalResult[];
  title: string;
}

const gradeLabels: Record<string, string> = {
  MUMTAZ: 'Mumtaz',
  JAYYID_JIDDAN: 'Jayyid Jiddan',
  JAYYID: 'Jayyid',
  TIDAK_LULUS: 'Tidak Lulus',
};

const batchLabels: Record<MunaqasyahBatch, string> = {
  [MunaqasyahBatch.TAHAP_1]: 'Tahap 1',
  [MunaqasyahBatch.TAHAP_2]: 'Tahap 2',
  [MunaqasyahBatch.TAHAP_3]: 'Tahap 3',
  [MunaqasyahBatch.TAHAP_4]: 'Tahap 4',
};

export function MunaqasyahFinalResultTable({ data, title }: Props) {
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
  } = useDataTableState<MunaqasyahFinalResult, string>();

  const [selectedPeriod, setSelectedPeriod] = useState<string | 'ALL'>('ALL');

  const academicPeriods = useMemo(() => {
    const set = new Set<string>();
    for (const d of data) {
      set.add(`${d.academicYear}__${d.semester}`);
    }
    return Array.from(set).sort();
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter((result) => {
      // Filter by period
      if (selectedPeriod !== 'ALL') {
        const periodKey = `${result.academicYear}__${result.semester}`;
        if (periodKey !== selectedPeriod) return false;
      }

      return true;
    });
  }, [data, selectedPeriod]);

  const columns = useMemo<ColumnDef<MunaqasyahFinalResult>[]>(
    () => [
      {
        id: 'Tanggal',
        header: 'Periode',
        cell: ({ row }) => {
          const result = row.original;
          return (
            <div className="text-sm min-w-[120px]">
              <div className="font-medium">{result.academicYear}</div>
              <div className="text-muted-foreground text-xs">{result.semester}</div>
              <div className="text-muted-foreground text-xs">{result.classroomName}</div>
            </div>
          );
        },
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
        id: 'Kelas',
        header: 'Kelas/Kelompok',
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">{row.original.classroomName}</div>
            <div className="text-muted-foreground">{row.original.groupName}</div>
          </div>
        ),
      },
      {
        id: 'Materi',
        header: 'Materi',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1 min-w-[140px]">
            <Badge variant="secondary" className="text-xs w-fit">
              {batchLabels[row.original.batch]}
            </Badge>
            <Badge variant="default" className="text-xs w-fit">
              {row.original.juz.name}
            </Badge>
          </div>
        ),
      },
      {
        id: 'Nilai Tasmi',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nilai Tasmi" />,
        cell: ({ row }) => {
          const tasmi = row.original.tasmiResult;
          return (
            <div className="text-sm">
              <div className="font-medium">
                {tasmi.score.toFixed(1)} ({gradeLabels[tasmi.grade] || tasmi.grade})
              </div>
              <Badge
                variant="outline"
                className={
                  tasmi.passed
                    ? 'text-green-600 border-green-600 text-xs'
                    : 'text-red-600 border-red-600 text-xs'
                }
              >
                {tasmi.passed ? 'Lulus' : 'Tidak Lulus'}
              </Badge>
            </div>
          );
        },
      },
      {
        id: 'Nilai Munaqasyah',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nilai Munaqasyah" />,
        cell: ({ row }) => {
          const munaqasyah = row.original.munaqasyahResult;
          return (
            <div className="text-sm">
              <div className="font-medium">
                {munaqasyah.score.toFixed(1)} ({gradeLabels[munaqasyah.grade] || munaqasyah.grade})
              </div>
              <Badge
                variant="outline"
                className={
                  munaqasyah.passed
                    ? 'text-green-600 border-green-600 text-xs'
                    : 'text-red-600 border-red-600 text-xs'
                }
              >
                {munaqasyah.passed ? 'Lulus' : 'Tidak Lulus'}
              </Badge>
            </div>
          );
        },
      },
      {
        id: 'Nilai Final',
        accessorKey: 'finalScore',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nilai Final" />,
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-bold text-lg">{row.original.finalScore.toFixed(1)}</div>
            <div className="font-medium text-primary">
              {gradeLabels[row.original.finalGrade] || row.original.finalGrade}
            </div>
            <Badge
              variant={row.original.passed ? 'default' : 'destructive'}
              className="text-xs mt-1"
            >
              {row.original.passed ? '✅ LULUS' : '❌ TIDAK LULUS'}
            </Badge>
          </div>
        ),
      },
      {
        id: 'Detail Nilai',
        header: 'Detail Nilai',
        cell: ({ row }) => {
          const { tasmiResult, munaqasyahResult } = row.original;
          return (
            <div className="text-xs space-y-2">
              {tasmiResult.scoreDetails && (
                <div className="space-y-0.5">
                  <div className="font-medium text-blue-600">Tasmi:</div>
                  <div>Tajwid: {tasmiResult.scoreDetails.tajwid}</div>
                  <div>Kelancaran: {tasmiResult.scoreDetails.kelancaran}</div>
                  <div>Adab: {tasmiResult.scoreDetails.adab}</div>
                  {tasmiResult.scoreDetails.note && (
                    <div className="text-muted-foreground">
                      Catatan: {tasmiResult.scoreDetails.note}
                    </div>
                  )}
                </div>
              )}
              {munaqasyahResult.scoreDetails && (
                <div className="space-y-0.5">
                  <div className="font-medium text-green-600">Munaqasyah:</div>
                  <div>Tajwid: {munaqasyahResult.scoreDetails.tajwid}</div>
                  <div>Kelancaran: {munaqasyahResult.scoreDetails.kelancaran}</div>
                  <div>Adab: {munaqasyahResult.scoreDetails.adab}</div>
                  {munaqasyahResult.scoreDetails.note && (
                    <div className="text-muted-foreground">
                      Catatan: {munaqasyahResult.scoreDetails.note}
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

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    state: { sorting, columnFilters, columnVisibility },
  });

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-wrap gap-4">
        <div className="min-w-[200px]">
          <Label htmlFor="period-filter">Filter Periode</Label>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger id="period-filter">
              <SelectValue placeholder="Pilih periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Periode</SelectItem>
              {academicPeriods.map((period) => {
                const [year, semester] = period.split('__');
                return (
                  <SelectItem key={period} value={period}>
                    {year} - {semester}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">
                  Daftar hasil final munaqasyah yang telah selesai
                </p>
              </div>
              <Badge variant="secondary" className="text-sm">
                Total: {filteredData.length} hasil
              </Badge>
            </div>
            <DataTable table={table} filterColumn="Siswa" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
