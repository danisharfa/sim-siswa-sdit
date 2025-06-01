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
import { Label } from '@/components/ui/label';
import { useDataTableState } from '@/lib/hooks/use-data-table';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { DataTable } from '@/components/ui/data-table';
import { Semester, TashihType } from '@prisma/client';

interface TashihSchedule {
  id: string;
  date: string;
  sessionName: string;
  startTime: string;
  endTime: string;
  location: string;
  schedules: {
    tashihRequest: {
      tashihType?: TashihType;
      surah?: { name: string };
      juz?: { name: string };
      wafa?: { name: string };
      startPage?: number;
      endPage?: number;
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
  }[];
}

interface Props {
  data: TashihSchedule[];
  title: string;
}

export function TashihScheduleTable({ data, title }: Props) {
  const {
    sorting,
    setSorting,
    columnVisibility,
    setColumnVisibility,
    columnFilters,
    setColumnFilters,
  } = useDataTableState<TashihSchedule, string>();

  const [selectedYearSemester, setSelectedYearSemester] = useState<string | 'ALL'>('ALL');

  const yearSemesterOptions = useMemo(() => {
    const set = new Set<string>();
    for (const schedule of data) {
      for (const s of schedule.schedules) {
        const r = s.tashihRequest;
        if (r.group.classroom.academicYear && r.group.classroom.semester) {
          set.add(`${r.group.classroom.academicYear}__${r.group.classroom.semester}`);
        }
      }
    }
    return Array.from(set);
  }, [data]);

  const columns = useMemo<ColumnDef<TashihSchedule>[]>(
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
        id: 'Sesi',
        header: 'Sesi',
        cell: ({ row }) =>
          `${row.original.sessionName}, ${row.original.startTime} - ${row.original.endTime}`,
      },
      {
        accessorKey: 'location',
        id: 'Lokasi',
        header: 'Lokasi',
      },
      {
        accessorKey: 'schedules.tashihRequest.student.user.fullName',
        id: 'Siswa',
        header: 'Siswa',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.schedules.map((s, i) => (
              <Badge key={i} variant="outline" className="w-fit text-muted-foreground">
                {s.tashihRequest.student.user.fullName} ({s.tashihRequest.student.nis})
              </Badge>
            ))}
          </div>
        ),
      },
      {
        accessorKey: 'schedules.tashihRequest.group.name',
        id: 'Kelompok',
        header: 'Kelompok',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.schedules.map((s, i) => {
              const r = s.tashihRequest;
              return (
                <Badge key={i} variant="outline" className="w-fit text-muted-foreground">
                  {r.group.name && r.group.classroom.name
                    ? `${r.group.name} - ${r.group.classroom.name}`
                    : 'Tidak terdaftar'}
                </Badge>
              );
            })}
          </div>
        ),
      },
      {
        id: 'Tahun Ajaran',
        header: 'Tahun Ajaran',
        accessorFn: (row) => {
          const set = new Set<string>();
          row.schedules.forEach((s) => {
            const r = s.tashihRequest;
            set.add(`${r.group.classroom.academicYear} ${r.group.classroom.semester}`);
          });
          return Array.from(set).join(', ');
        },
        filterFn: (row, columnId, filterValue) => {
          const value = row.getValue(columnId) as string;
          return value.includes(filterValue);
        },
      },
      {
        accessorKey: 'schedules.tashihRequest.teacher.user.fullName',
        id: 'Guru Pembimbing',
        header: 'Guru Pembimbing',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.schedules.map((s, i) => (
              <Badge key={i} variant="secondary" className="w-fit">
                {s.tashihRequest.teacher.user.fullName}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        accessorKey: 'schedules.tashihRequest.tashihType',
        id: 'Materi',
        header: 'Materi',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.schedules.map((s, i) => {
              const r = s.tashihRequest;
              return (
                <Badge key={i} variant="outline" className="w-fit text-muted-foreground">
                  {r.tashihType === TashihType.ALQURAN
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

  return (
    <>
      <div className="mb-4">
        <Label className="mb-2 block">Tahun Ajaran</Label>
        <Select
          value={selectedYearSemester}
          onValueChange={(value) => {
            setSelectedYearSemester(value);
            table
              .getColumn('Tahun Ajaran')
              ?.setFilterValue(value === 'ALL' ? undefined : value.replace('__', ' '));
          }}
        >
          <SelectTrigger className="w-min-[200px] w-[300px]">
            <SelectValue placeholder="Pilih Tahun Ajaran" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua</SelectItem>
            {yearSemesterOptions.map((val) => {
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

      <DataTable title={title} table={table} filterColumn="Tanggal" />
    </>
  );
}
