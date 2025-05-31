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
      academicYear: string;
      semester: Semester;
      classroomName: string;
      groupName: string;
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
        if (r.academicYear && r.semester) {
          set.add(`${r.academicYear}__${r.semester}`);
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
                {s.tashihRequest.student.user.fullName}
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
      {
        id: 'Kelompok',
        header: 'Kelompok',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.schedules.map((s, i) => {
              const r = s.tashihRequest;
              return (
                <Badge key={i} variant="outline" className="w-fit text-muted-foreground">
                  {r.groupName && r.classroomName
                    ? `${r.groupName} - ${r.classroomName}`
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
            if (r.academicYear && r.semester) {
              set.add(`${r.academicYear} ${r.semester}`);
            }
          });
          return Array.from(set).join(', ');
        },
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.schedules.map((s, i) => {
              const r = s.tashihRequest;
              return (
                <Badge key={i} variant="outline" className="w-fit text-muted-foreground">
                  {r.academicYear && r.semester ? `${r.academicYear} ${r.semester}` : '-'}
                </Badge>
              );
            })}
          </div>
        ),
      },
      {
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
