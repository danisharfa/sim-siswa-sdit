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
import { Semester, TashihType } from '@prisma/client';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';

interface ExamResult {
  id: string;
  passed: boolean;
  notes: string | null;
  tashihRequest: {
    tashihType: TashihType;
    surah: { name: string } | null;
    juz: { name: string } | null;
    wafa: { name: string } | null;
    startPage: number | null;
    endPage: number | null;
    groupName: string;
    classroomName: string;
    academicYear: string;
    semester: Semester;
  };
  tashihSchedule: {
    date: string;
    sessionName: string;
    startTime: string;
    endTime: string;
    location: string;
  };
}

interface Props {
  data: ExamResult[];
}

export function StudentTashihResultTable({ data }: Props) {
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
  } = useDataTableState<ExamResult, string>();

  const [selectedPeriod, setSelectedPeriod] = useState('all');

  const academicPeriods = useMemo(() => {
    return Array.from(
      new Set(data.map((d) => `${d.tashihRequest.academicYear}-${d.tashihRequest.semester}`))
    );
  }, [data]);

  const columns = useMemo<ColumnDef<ExamResult>[]>(
    () => [
      {
        accessorKey: 'date',
        id: 'Tanggal',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal Ujian" />,
        cell: ({ row }) =>
          new Date(row.original.tashihSchedule.date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
      },
      {
        accessorKey: 'sessionName',
        header: 'Sesi',
        cell: ({ row }) =>
          `${row.original.tashihSchedule.sessionName}, ${row.original.tashihSchedule.startTime} - ${row.original.tashihSchedule.endTime}`,
      },
      {
        id: 'Kelompok',
        header: 'Kelompok',
        accessorFn: (row) => `${row.tashihRequest.groupName} - ${row.tashihRequest.classroomName}`,
        cell: ({ row }) => (
          <Badge variant="outline">
            {`${row.original.tashihRequest.groupName} - ${row.original.tashihRequest.classroomName}`}
          </Badge>
        ),
      },
      {
        id: 'Tahun Ajaran',
        header: 'Tahun Ajaran',
        accessorFn: (row) => `${row.tashihRequest.academicYear} ${row.tashihRequest.semester}`,
        filterFn: (row, columnId, filterValue) => {
          const value = row.getValue(columnId) as string;
          return value.includes(filterValue);
        },
        cell: ({ row }) => (
          <Badge variant="outline">
            {`${row.original.tashihRequest.academicYear} ${row.original.tashihRequest.semester}`}
          </Badge>
        ),
      },
      {
        id: 'Materi',
        header: 'Materi Ujian',
        accessorFn: (row) => {
          const r = row.tashihRequest;
          return r.tashihType === 'ALQURAN'
            ? `${r.surah?.name ?? '-'} (${r.juz?.name ?? '-'})`
            : `${r.wafa?.name ?? '-'} (Hal ${r.startPage ?? '-'}${
                r.endPage ? `–${r.endPage}` : ''
              })`;
        },
        cell: ({ row }) => {
          const r = row.original.tashihRequest;
          return (
            <Badge variant="outline">
              {r.tashihType === 'ALQURAN'
                ? `${r.surah?.name ?? '-'} (${r.juz?.name ?? '-'})`
                : `${r.wafa?.name ?? '-'} (Hal ${r.startPage ?? '-'}${
                    r.endPage ? `–${r.endPage}` : ''
                  })`}
            </Badge>
          );
        },
      },

      {
        id: 'Status',
        accessorKey: 'passed',
        header: 'Lulus',
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
        accessorKey: 'notes',
        header: 'Catatan',
        cell: ({ row }) => row.original.notes || '-',
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

      <DataTable title="Hasil Tashih Saya" table={table} filterColumn="Materi" />
    </>
  );
}
