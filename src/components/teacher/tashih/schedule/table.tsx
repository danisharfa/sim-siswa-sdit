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

interface TeacherTashihSchedule {
  id: string;
  date: string;
  sessionName: string;
  startTime: string;
  endTime: string;
  location: string;
  schedules: {
    tashihRequests: {
      id: string;
      status: 'MENUNGGU' | 'DITERIMA' | 'DITOLAK' | 'SELESAI';
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
  }[];
}

interface TeacherTashihScheduleTableProps {
  data: TeacherTashihSchedule[];
}

export function TeacherTashihScheduleTable({ data }: TeacherTashihScheduleTableProps) {
  const columns = useMemo<ColumnDef<TeacherTashihSchedule>[]>(
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
        id: 'Daftar',
        header: 'Siswa & Materi',
        cell: ({ row }) => (
          <div className="flex flex-col gap-2">
            {row.original.schedules.map((s, i) => {
              const r = s.tashihRequests;
              const materi =
                r.tashihType === 'ALQURAN'
                  ? `${r.surah?.name ?? '-'} (${r.juz?.name ?? '-'})`
                  : `${r.wafa?.name ?? '-'} (Hal ${r.startPage ?? '-'}${
                      r.startPage !== r.endPage ? `–${r.endPage}` : ''
                    })`;
              return (
                <div key={i} className="flex flex-col">
                  <Badge variant="outline" className="w-fit">
                    {r.student.user.fullName} | {materi}
                  </Badge>
                </div>
              );
            })}
          </div>
        ),
      },
      {
        id: 'Kelompok & Kelas',
        header: 'Kelompok & Kelas',
        cell: ({ row }) => (
          <div className="flex flex-col gap-2">
            {row.original.schedules.map((s, i) => {
              const group = s.tashihRequests.student.group;
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
        id: 'Status',
        header: 'Status',
        cell: ({ row }) => (
          <div className="flex flex-col gap-2">
            {row.original.schedules.map((s, i) => {
              const r = s.tashihRequests;
              const variant =
                r.status === 'DITERIMA'
                  ? 'text-green-500 border-green-500'
                  : r.status === 'DITOLAK'
                  ? 'text-red-500 border-red-500'
                  : r.status === 'SELESAI'
                  ? 'text-blue-500 border-blue-500'
                  : 'text-yellow-500 border-yellow-500';
              return (
                <Badge key={i} variant="outline" className={`w-fit ${variant}`}>
                  {r.status}
                </Badge>
              );
            })}
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
