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
import { useDataTableState } from '@/lib/hooks/use-data-table';
import { DataTable } from '@/components/ui/data-table';
import { Semester, MunaqasyahStage, MunaqasyahBatch, MunaqasyahGrade } from '@prisma/client';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { Label } from '@/components/ui/label';

interface MunaqasyahResult {
  id: string;
  avarageScore: number | null;
  grade: MunaqasyahGrade;
  passed: boolean;
  createdAt: string;
  updatedAt: string;
  request: {
    id: string;
    batch: MunaqasyahBatch;
    stage: MunaqasyahStage;
    status: string;
    juz: { name: string };
    student: {
      nis: string;
      user: { fullName: string };
    };
    teacher: {
      user: { fullName: string };
    };
    group: {
      name: string;
      classroom: {
        name: string;
        academicYear: string;
        semester: Semester;
      };
    };
  };
  schedule: {
    date: string;
    sessionName: string;
    startTime: string;
    endTime: string;
    location: string;
    examiner: {
      user: { fullName: string };
    } | null;
  };
  tasmi?: {
    tajwid: number | null;
    kelancaran: number | null;
    adab: number | null;
    note?: string | null;
    totalScore: number | null;
  } | null;
  munaqasyah?: {
    tajwid: number | null;
    kelancaran: number | null;
    note?: string | null;
    totalScore: number | null;
  } | null;
}

interface Props {
  data: MunaqasyahResult[];
}

const gradeLabels: Record<MunaqasyahGrade, string> = {
  [MunaqasyahGrade.MUMTAZ]: 'Mumtaz',
  [MunaqasyahGrade.JAYYID_JIDDAN]: 'Jayyid Jiddan',
  [MunaqasyahGrade.JAYYID]: 'Jayyid',
  [MunaqasyahGrade.TIDAK_LULUS]: 'Tidak Lulus',
};

const stageLabels: Record<MunaqasyahStage, string> = {
  [MunaqasyahStage.TASMI]: 'Tasmi',
  [MunaqasyahStage.MUNAQASYAH]: 'Munaqasyah',
};

const batchLabels: Record<MunaqasyahBatch, string> = {
  [MunaqasyahBatch.TAHAP_1]: 'Tahap 1',
  [MunaqasyahBatch.TAHAP_2]: 'Tahap 2',
  [MunaqasyahBatch.TAHAP_3]: 'Tahap 3',
  [MunaqasyahBatch.TAHAP_4]: 'Tahap 4',
};

export function MunaqasyahResultTable({ data }: Props) {
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
  } = useDataTableState<MunaqasyahResult, string>();

  const [selectedPeriod, setSelectedPeriod] = useState<string | 'ALL'>('ALL');

  const academicPeriods = useMemo(() => {
    const set = new Set<string>();
    for (const d of data) {
      set.add(`${d.request.group.classroom.academicYear}__${d.request.group.classroom.semester}`);
    }
    return Array.from(set);
  }, [data]);

  const columns = useMemo<ColumnDef<MunaqasyahResult>[]>(
    () => [
      {
        id: 'Tanggal',
        accessorKey: 'schedule.date',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
        cell: ({ row }) => {
          const s = row.original.schedule;
          const date = new Date(s.date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });
          return (
            <div className="text-sm min-w-[180px]">
              <div className="font-medium">{date}</div>
              <div className="text-muted-foreground">{s.sessionName}</div>
              <div className="text-muted-foreground text-xs">
                {s.startTime} - {s.endTime}
              </div>
              <div className="text-muted-foreground text-xs">📍 {s.location}</div>
            </div>
          );
        },
      },
      {
        id: 'Batch',
        header: 'Batch',
        cell: ({ row }) => (
          <Badge variant="secondary">
            {batchLabels[row.original.request.batch]}
          </Badge>
        ),
      },
      {
        id: 'Tahap',
        accessorKey: 'request.stage',
        header: 'Tahap',
        cell: ({ row }) => (
          <Badge variant="outline">
            {stageLabels[row.original.request.stage]}
          </Badge>
        ),
      },
      {
        id: 'Juz',
        accessorKey: 'request.juz.name',
        header: 'Juz',
        cell: ({ row }) => (
          <Badge variant="default">
            {row.original.request.juz.name}
          </Badge>
        ),
      },
      {
        id: 'Tahun Ajaran',
        header: 'Tahun Ajaran',
        accessorFn: (row) =>
          `${row.request.group.classroom.academicYear} ${row.request.group.classroom.semester}`,
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">
              {row.original.request.group.classroom.academicYear}{' '}
              {row.original.request.group.classroom.semester}
            </div>
            <div className="text-muted-foreground">
              {row.original.request.group.name} -{' '}
              {row.original.request.group.classroom.name}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'request.teacher.user.fullName',
        id: 'Guru Pembimbing',
        header: 'Guru Pembimbing',
        cell: ({ row }) => (
          <Badge variant="secondary">
            {row.original.request.teacher.user.fullName}
          </Badge>
        ),
      },
      {
        id: 'Penguji',
        header: 'Penguji',
        cell: ({ row }) => {
          const examiner = row.original.schedule.examiner;
          return (
            <div className="text-sm">
              {examiner ? (
                <Badge variant="secondary">{examiner.user.fullName}</Badge>
              ) : (
                <span className="text-muted-foreground text-xs">Koordinator Al-Qur&apos;an</span>
              )}
            </div>
          );
        },
      },
      {
        id: 'Nilai',
        accessorKey: 'avarageScore',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nilai" />,
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">
              {row.original.avarageScore?.toFixed(1) || '0.0'} ({gradeLabels[row.original.grade]})
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              {row.original.tasmi && (
                <div>
                  Tasmi: {row.original.tasmi.totalScore?.toFixed(1) || '0.0'}
                </div>
              )}
              {row.original.munaqasyah && (
                <div>
                  Munaqasyah: {row.original.munaqasyah.totalScore?.toFixed(1) || '0.0'}
                </div>
              )}
            </div>
          </div>
        ),
      },
      {
        id: 'Status',
        accessorKey: 'passed',
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
        id: 'Detail',
        header: 'Detail',
        cell: ({ row }) => {
          const { tasmi, munaqasyah } = row.original;
          if (!tasmi && !munaqasyah) return '-';

          return (
            <div className="text-xs space-y-1">
              {tasmi && (
                <div className="space-y-0.5">
                  <div className="font-medium">Tasmi:</div>
                  <div>Tajwid: {tasmi.tajwid || 0}</div>
                  <div>Kelancaran: {tasmi.kelancaran || 0}</div>
                  <div>Adab: {tasmi.adab || 0}</div>
                  {tasmi.note && (
                    <div className="text-muted-foreground">
                      Catatan: {tasmi.note}
                    </div>
                  )}
                </div>
              )}
              {munaqasyah && (
                <div className="space-y-0.5">
                  <div className="font-medium">Munaqasyah:</div>
                  <div>Tajwid: {munaqasyah.tajwid || 0}</div>
                  <div>Kelancaran: {munaqasyah.kelancaran || 0}</div>
                  {munaqasyah.note && (
                    <div className="text-muted-foreground">
                      Catatan: {munaqasyah.note}
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
    data,
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

  return (
    <>
      <div className="mb-4">
        <Label className="mb-2 block">Filter Tahun Ajaran</Label>
        <Select
          value={selectedPeriod}
          onValueChange={(value) => {
            setSelectedPeriod(value);
            table
              .getColumn('Tahun Ajaran')
              ?.setFilterValue(value === 'ALL' ? undefined : value.replace('__', ' '));
          }}
        >
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Pilih Tahun Ajaran" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Tahun Ajaran</SelectItem>
            {academicPeriods.map((val) => {
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

      <DataTable title="Hasil Munaqasyah Saya" table={table} filterColumn="Juz" />
    </>
  );
}