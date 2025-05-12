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
  passed: boolean;
  notes?: string;
  tashihRequests: {
    tashihType: 'ALQURAN' | 'WAFA';
    surah?: { name: string };
    juz?: { name: string };
    wafa?: { name: string };
    startPage?: number;
    endPage?: number;
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
  tashihSchedules: {
    date: string;
    sessionName: string;
    startTime: string;
    endTime: string;
    location: string;
  };
}

interface TeacherTashihResultTableProps {
  data: ExamResult[];
}

export function TeacherTashihResultTable({ data }: TeacherTashihResultTableProps) {
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
        accessorKey: 'tashihSchedules.date',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal Ujian" />,
        cell: ({ row }) => {
          const s = row.original.tashihSchedules;
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
        accessorKey: 'tashihSchedules.location',
        header: 'Lokasi',
      },
      {
        id: 'Nama Siswa',
        accessorKey: 'tashihRequests.student.user.fullName',
        header: 'Nama Siswa',
        cell: ({ row }) => row.original.tashihRequests.student.user.fullName,
      },
      {
        id: 'Kelompok & Kelas',
        accessorKey: 'tashihRequests.student.group.name',
        header: 'Kelompok & Kelas',
        cell: ({ row }) => {
          const group = row.original.tashihRequests.student.group;
          return (
            <Badge variant="secondary" className="w-fit">
              {group
                ? `${group.name} - ${group.classroom.name} (${group.classroom.academicYear})`
                : 'Tidak terdaftar'}
            </Badge>
          );
        },
      },
      {
        id: 'Materi',
        header: 'Materi Ujian',
        cell: ({ row }) => {
          const r = row.original.tashihRequests;
          const materi =
            r.tashihType === 'ALQURAN'
              ? `${r.surah?.name ?? '-'} (${r.juz?.name ?? '-'})`
              : `${r.wafa?.name ?? '-'} (Hal ${r.startPage ?? '-'}${
                  r.startPage !== r.endPage ? `–${r.endPage}` : ''
                })`;
          return <Badge variant="outline">{materi}</Badge>;
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
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
  });

  return <DataTable title="Hasil Ujian Siswa Bimbingan" table={table} filterColumn="Nama Siswa" />;
}
