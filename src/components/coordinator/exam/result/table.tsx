// components/coordinator/exam/result/table.tsx
'use client';

import { useMemo } from 'react';
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
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { DataTable } from '@/components/ui/data-table';

interface ExamResult {
  id: string;
  score: number;
  passed: boolean;
  notes?: string;
  examRequest: {
    examType: 'SURAH' | 'JUZ';
    surah?: { name: string };
    juz?: { name: string };
    student: {
      nis: string;
      user: { fullName: string };
    };
    teacher: {
      user: { fullName: string };
    };
  };
  examSchedule: {
    date: string;
    sessionName: string;
    startTime: string;
    endTime: string;
    location: string;
  };
}

interface ExamResultTableProps {
  data: ExamResult[];
  title: string;
}

export function ExamResultTable({ data, title }: ExamResultTableProps) {
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
  } = useDataTableState<ExamResult, string>();
  const columns = useMemo<ColumnDef<ExamResult>[]>(
    () => [
      {
        id: 'Tanggal',
        accessorKey: 'examSchedule.date',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal Ujian" />,
        cell: ({ row }) => {
          const schedule = row.original.examSchedule;
          const date = new Date(schedule.date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });
          return `${date} (${schedule.sessionName}, ${schedule.startTime} - ${schedule.endTime})`;
        },
      },
      {
        id: 'Lokasi',
        accessorKey: 'examSchedule.location',
        header: 'Lokasi',
      },
      {
        id: 'Nama Siswa',
        accessorKey: 'examRequest.student.user.fullName',
        header: 'Nama Siswa',
        cell: ({ row }) => row.original.examRequest.student.user.fullName,
      },
      {
        id: 'Jenis Ujian',
        accessorKey: 'examRequest.examType',
        header: 'Jenis',
        cell: ({ row }) => {
          const req = row.original.examRequest;
          return (
            <Badge variant="outline">
              {req.examType === 'SURAH' ? `Surah: ${req.surah?.name}` : `Juz: ${req.juz?.name}`}
            </Badge>
          );
        },
      },
      {
        id: 'Guru',
        accessorKey: 'examRequest.teacher.user.fullName',
        header: 'Guru Pembimbing',
        cell: ({ row }) => row.original.examRequest.teacher.user.fullName,
      },
      {
        id: 'Nilai',
        accessorKey: 'score',
        header: 'Nilai',
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
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
  });

  return <DataTable title={title} table={table} filterColumn="Nama Siswa" />;
}
