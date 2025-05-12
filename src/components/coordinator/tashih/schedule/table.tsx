'use client';

import { useMemo } from 'react';
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { useDataTableState } from '@/lib/hooks/use-data-table';

interface TashihSchedule {
  id: string;
  date: string;
  sessionName: string;
  startTime: string;
  endTime: string;
  location: string;
  schedules: {
    tashihRequests: {
      student: {
        nis: string;
        user: { fullName: string };
        group?: {
          name: string;
          classroom: { name: string; academicYear: string };
        };
      };
      tashihType?: 'ALQURAN' | 'WAFA';
      surah?: { name: string };
      juz?: { name: string };
      wafa?: { name: string };
      startPage?: number;
      endPage?: number;
      teacher: {
        user: { fullName: string };
      };
    };
  }[];
}

interface Props {
  data: TashihSchedule[];
  title: string;
}

export function TashihScheduleTable({ data, title }: Props) {
  const { sorting, setSorting, columnVisibility, setColumnVisibility } = useDataTableState<
    TashihSchedule,
    string
  >();

  const columns = useMemo<ColumnDef<TashihSchedule>[]>(
    () => [
      {
        accessorKey: 'date',
        id: 'Tanggal',
        header: 'Tanggal',
        cell: ({ row }) =>
          new Date(row.original.date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
      },
      {
        accessorKey: 'sessionName',
        id: 'Sesi',
        header: 'Sesi',
        cell: ({ row }) =>
          `${row.original.sessionName}, ${row.original.startTime} - ${row.original.endTime}`,
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
        id: 'Siswa',
        header: 'Siswa',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.schedules.map((s, i) => (
              <Badge key={i} variant="outline" className="w-fit text-muted-foreground">
                {s.tashihRequests.student.user.fullName}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        id: 'Materi',
        header: 'Materi',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.schedules.map((s, i) => {
              const r = s.tashihRequests;
              return (
                <Badge key={i} variant="outline" className="w-fit text-muted-foreground">
                  {r.tashihType === 'ALQURAN'
                    ? `${r.surah?.name ?? '-'} (${r.juz?.name ?? '-'})`
                    : `${r.wafa?.name ?? '-'} (Hal ${r.startPage ?? '-'}${
                        r.startPage !== r.endPage ? `–${r.endPage}` : ''
                      })`}
                </Badge>
              );
            })}
          </div>
        ),
      },
      {
        id: 'Kelompok & Guru',
        header: 'Kelompok',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.schedules.map((s, i) => {
              const r = s.tashihRequests;
              const group = r.student.group;
              const groupInfo = group
                ? `${group.name} - ${group.classroom.name} (${group.classroom.academicYear})`
                : 'Tidak terdaftar';
              const teacherName = r.teacher.user.fullName;

              return (
                <Badge key={i} variant="secondary" className="w-fit">
                  {groupInfo} | {teacherName}
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
    state: {
      sorting,
      columnVisibility,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
  });

  return <DataTable title={title} table={table} filterColumn="Tanggal" />;
}
