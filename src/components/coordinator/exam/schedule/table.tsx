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
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';

interface ExamSchedule {
  id: string;
  date: string;
  sessionName: string;
  startTime: string;
  endTime: string;
  location: string;
  schedules: {
    examRequest: {
      student: {
        nis: string;
        user: {
          fullName: string;
        };
      };
      teacher: {
        user: {
          fullName: string;
        };
      };
      examType: 'SURAH' | 'JUZ';
      surah?: { name: string };
      juz?: { name: string };
    };
  }[];
}

interface ExamScheduleTableProps {
  data: ExamSchedule[];
  title: string;
  onRefresh: () => void;
}

export function ExamScheduleTable({ data, title, onRefresh }: ExamScheduleTableProps) {
  const columns = useMemo<ColumnDef<ExamSchedule>[]>(
    () => [
      {
        accessorKey: 'date',
        id: 'Tanggal',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
        cell: ({ row }) =>
          new Date(row.original.date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
      },
      {
        accessorKey: 'sessionName',
        header: 'Sesi',
      },
      {
        accessorKey: 'startTime',
        header: 'Jam Mulai',
      },
      {
        accessorKey: 'endTime',
        header: 'Jam Selesai',
      },
      {
        accessorKey: 'location',
        header: 'Lokasi',
      },
      {
        id: 'Jumlah Siswa',
        header: 'Jumlah Siswa',
        cell: ({ row }) => row.original.schedules.length,
      },
      {
        id: 'Daftar Siswa',
        header: 'Siswa',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.schedules.map((s, i) => (
              <Badge key={i} variant="outline" className="w-fit text-muted-foreground">
                {s.examRequest.student.user.fullName} (
                {s.examRequest.examType === 'SURAH'
                  ? `Surah: ${s.examRequest.surah?.name}`
                  : `Juz: ${s.examRequest.juz?.name}`}
                )
              </Badge>
            ))}
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: {},
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return <DataTable title={title} table={table} filterColumn="Tanggal" />;
}
