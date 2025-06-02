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
import { Semester, MunaqasyahStage, MunaqasyahGrade } from '@prisma/client';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';

interface MunaqasyahResult {
  id: string;
  score: number;
  grade: MunaqasyahGrade;
  passed: boolean;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  request: {
    id: string;
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
}

interface Props {
  data: MunaqasyahResult[];
}

const gradeLabels: Record<MunaqasyahGrade, string> = {
  MUMTAZ: 'Mumtaz',
  JAYYID_JIDDAN: 'Jayyid Jiddan',
  JAYYID: 'Jayyid',
  TIDAK_LULUS: 'Tidak Lulus',
};

const stageLabels: Record<MunaqasyahStage, string> = {
  TAHAP_1: 'Tahap 1',
  TAHAP_2: 'Tahap 2',
  TAHAP_3: 'Tahap 3',
  MUNAQASYAH: 'Munaqasyah',
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

  const [selectedPeriod, setSelectedPeriod] = useState('all');

  const academicPeriods = useMemo(() => {
    return Array.from(
      new Set(
        data.map(
          (d) =>
            `${d.request.group.classroom.academicYear}-${d.request.group.classroom.semester}`
        )
      )
    );
  }, [data]);

  const columns = useMemo<ColumnDef<MunaqasyahResult>[]>(
    () => [
      {
        id: 'Tanggal',
        accessorKey: 'date',
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
          <Badge variant="secondary">
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
        accessorKey: 'schedule.examiner.user.fullName',
        id: 'penguji',
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
        accessorKey: 'score',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nilai" />,
        cell: ({ row }) => (
          <div className="text-center">
            <div className="font-bold text-lg">{row.original.score}</div>
            <Badge
              variant="outline"
              className={
                row.original.passed
                  ? 'text-green-600 border-green-600'
                  : 'text-red-600 border-red-600'
              }
            >
              {gradeLabels[row.original.grade]}
            </Badge>
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
        id: 'Catatan',
        accessorKey: 'note',
        header: 'Catatan',
        cell: ({ row }) => (
          <div className="max-w-xs truncate" title={row.original.note || '-'}>
            {row.original.note || '-'}
          </div>
        ),
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
      <div className="mb-4 w-[260px]">
        <Select
          value={selectedPeriod}
          onValueChange={(val) => {
            setSelectedPeriod(val);
            table
              .getColumn('Tahun Ajaran')
              ?.setFilterValue(val === 'all' ? undefined : val.replace('-', ' '));
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih Tahun Ajaran" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tahun Ajaran</SelectItem>
            {academicPeriods.map((p) => (
              <SelectItem key={p} value={p}>
                {p.replace('-', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable title="Hasil Munaqasyah Saya" table={table} filterColumn="Juz" />
    </>
  );
}