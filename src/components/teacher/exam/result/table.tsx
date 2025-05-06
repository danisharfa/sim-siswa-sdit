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
      group?: {
        name: string;
        classroom: {
          name: string;
          academicYear: string;
        };
      };
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

interface TeacherExamResultTableProps {
  data: ExamResult[];
}

export function TeacherExamResultTable({ data }: TeacherExamResultTableProps) {
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
          const s = row.original.examSchedule;
          const date = new Date(s.date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });
          return `${date} (${s.sessionName}, ${s.startTime} - ${s.endTime})`;
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
        id: 'Kelompok & Kelas',
        accessorKey: 'examRequest.student.group.name',
        header: 'Kelompok & Kelas',
        cell: ({ row }) => {
          const group = row.original.examRequest.student.group;
          return group
            ? `${group.name} - ${group.classroom.name} (${group.classroom.academicYear})`
            : 'Tidak terdaftar';
        },
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

  return <DataTable title="Hasil Ujian Siswa Bimbingan" table={table} filterColumn="Nama Siswa" />;
}
