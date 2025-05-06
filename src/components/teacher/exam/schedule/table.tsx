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

interface TeacherExamSchedule {
  id: string;
  date: string;
  sessionName: string;
  startTime: string;
  endTime: string;
  location: string;
  schedules: {
    examRequest: {
      id: string;
      examType: 'SURAH' | 'JUZ';
      status: string;
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
  }[];
}

interface TeacherExamScheduleTableProps {
  data: TeacherExamSchedule[];
}

export function TeacherExamScheduleTable({ data }: TeacherExamScheduleTableProps) {
  const columns = useMemo<ColumnDef<TeacherExamSchedule>[]>(
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
        id: 'Sesi & Waktu',
        header: 'Sesi & Waktu',
        cell: ({ row }) => {
          const { sessionName, startTime, endTime } = row.original;
          return `${sessionName}, ${startTime} - ${endTime}`;
        },
      },
      {
        accessorKey: 'location',
        id: 'Lokasi',
        header: 'Lokasi',
      },
      {
        id: 'Jumlah',
        header: 'Jumlah Siswa',
        cell: ({ row }) => row.original.schedules.length,
      },
      {
        accessorKey: 'schedules',
        id: 'Kelompok & Kelas',
        header: 'Kelompok & Kelas',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.schedules.map((s, i) => {
              const group = s.examRequest.student.group;
              return (
                <Badge key={i} variant="secondary" className="w-fit">
                  {group
                    ? `${group.name} - ${group.classroom.name} (${group.classroom.academicYear})`
                    : 'Tidak terdaftar'}
                </Badge>
              );
            })}
          </div>
        ),
      },
      {
        accessorKey: 'schedules.examRequest.student.user.fullName',
        id: 'Siswa',
        header: 'Daftar Siswa',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.schedules.map((s, i) => (
              <Badge key={i} variant="outline" className="w-fit text-muted-foreground">
                {s.examRequest.student.user.fullName} -{' '}
                {s.examRequest.examType === 'SURAH'
                  ? `Surah: ${s.examRequest.surah?.name}`
                  : `Juz: ${s.examRequest.juz?.name}`}
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
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return <DataTable title="Jadwal Ujian Bimbingan" table={table} filterColumn="Tanggal" />;
}
