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
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { useDataTableState } from '@/lib/hooks/use-data-table';

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
          id: string;
          name: string;
          classroom: {
            name: string;
            academicYear: string;
            semester?: string;
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
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
  } = useDataTableState<TeacherTashihSchedule, string>();

  const [selectedYearSemester, setSelectedYearSemester] = useState<string | 'ALL'>('ALL');
  const [selectedGroupId, setSelectedGroupId] = useState<string | 'ALL'>('ALL');

  const yearSemesterOptions = useMemo(() => {
    const set = new Set<string>();
    for (const schedule of data) {
      for (const s of schedule.schedules) {
        const g = s.tashihRequests.student.group;
        if (g && g.classroom.semester) {
          set.add(`${g.classroom.academicYear}__${g.classroom.semester}`);
        }
      }
    }
    return Array.from(set);
  }, [data]);

  const groupOptions = useMemo(() => {
    const set = new Map<string, string>();
    for (const schedule of data) {
      for (const s of schedule.schedules) {
        const g = s.tashihRequests.student.group;
        if (g) {
          set.set(g.id, `${g.name} - ${g.classroom.name}`);
        }
      }
    }
    return Array.from(set.entries());
  }, [data]);

  const columns = useMemo<ColumnDef<TeacherTashihSchedule>[]>(
    () => [
      {
        accessorKey: 'date',
        id: 'Tanggal',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal Ujian" />,
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
        id: 'Siswa',
        header: 'Siswa',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.schedules.map((s) => (
              <Badge
                key={s.tashihRequests.id}
                variant="outline"
                className="w-fit text-muted-foreground"
              >
                {s.tashihRequests.student.user.fullName}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        id: 'Kelompok',
        header: 'Kelompok',
        accessorFn: (row) => {
          return row.schedules
            .map((s) => s.tashihRequests.student.group)
            .filter((g): g is NonNullable<typeof g> => !!g)
            .map((g) => `${g.name} - ${g.classroom.name}`)
            .join(', ');
        },
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.schedules.map((s) => {
              const g = s.tashihRequests.student.group;
              return (
                <Badge
                  key={s.tashihRequests.id + '-g'}
                  variant="outline"
                  className="w-fit text-muted-foreground"
                >
                  {g ? `${g.name} - ${g.classroom.name}` : 'Tidak terdaftar'}
                </Badge>
              );
            })}
          </div>
        ),
        filterFn: (row, columnId, filterValue) => {
          const value = row.getValue(columnId) as string;
          return value.includes(filterValue);
        },
      },
      {
        id: 'Tahun Ajaran',
        header: 'Tahun Ajaran',
        accessorFn: (row) => {
          const set = new Set<string>();
          row.schedules.forEach((s) => {
            const g = s.tashihRequests.student.group;
            if (g?.classroom.semester) {
              set.add(`${g.classroom.academicYear} ${g.classroom.semester}`);
            }
          });
          return Array.from(set).join(', ');
        },
        filterFn: (row, columnId, filterValue) => {
          const value = row.getValue(columnId) as string;
          return value.includes(filterValue);
        },
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
      <div className="grid grid-cols-1 sm:flex gap-4 mb-4">
        <div className="space-y-1">
          <Select
            value={selectedYearSemester}
            onValueChange={(value) => {
              setSelectedYearSemester(value);
              table
                .getColumn('Tahun Ajaran')
                ?.setFilterValue(value === 'ALL' ? undefined : value.replace('__', ' '));
            }}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Pilih Tahun Ajaran" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Tahun Ajaran</SelectItem>
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

        <div className="space-y-1">
          <Select
            value={selectedGroupId}
            onValueChange={(value) => {
              setSelectedGroupId(value);
              table.getColumn('Kelompok')?.setFilterValue(value === 'ALL' ? undefined : value);
            }}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Pilih Kelompok" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Kelompok</SelectItem>
              {groupOptions.map(([id, label]) => (
                <SelectItem key={id} value={label}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable title="Jadwal Ujian Bimbingan" table={table} filterColumn="Tanggal" />
    </>
  );
}
