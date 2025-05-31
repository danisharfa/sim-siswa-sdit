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
import { TashihRequestStatus, TashihType } from '@prisma/client';

interface TashihSchedule {
  id: string;
  date: string;
  sessionName: string;
  startTime: string;
  endTime: string;
  location: string;
  schedules: {
    tashihRequest: {
      id: string;
      status: TashihRequestStatus;
      tashihType: TashihType;
      surah: { name: string } | null;
      juz: { name: string } | null;
      wafa: { name: string } | null;
      startPage: number | null;
      endPage: number | null;
      academicYear: string;
      semester: string;
      groupName: string;
      classroomName: string;
      teacher: {
        user: { fullName: string };
      } | null;
    };
  }[];
}

interface TashihScheduleTableProps {
  data: TashihSchedule[];
}

export function TashihScheduleTable({ data }: TashihScheduleTableProps) {
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
  } = useDataTableState<TashihSchedule, string>();

  const [selectedPeriod, setSelectedPeriod] = useState<string | 'ALL'>('ALL');

  const academicPeriods = useMemo(() => {
    const set = new Set<string>();
    for (const schedule of data) {
      for (const s of schedule.schedules) {
        set.add(`${s.tashihRequest.academicYear}__${s.tashihRequest.semester}`);
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
        header: 'Sesi',
        cell: ({ row }) =>
          `${row.original.sessionName}, ${row.original.startTime} - ${row.original.endTime}`,
      },
      {
        accessorKey: 'location',
        header: 'Lokasi',
      },
      {
        id: 'Materi',
        header: 'Materi Ujian',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.schedules.map((s) => {
              const r = s.tashihRequest;
              const materi =
                r.tashihType === TashihType.ALQURAN
                  ? `${r.surah?.name ?? '-'} (${r.juz?.name ?? '-'})`
                  : `${r.wafa?.name ?? '-'} (Hal ${r.startPage ?? '-'}${
                      r.endPage ? `–${r.endPage}` : ''
                    })`;
              return (
                <Badge
                  key={r.id + '-materi'}
                  variant="outline"
                  className="w-fit text-muted-foreground"
                >
                  {materi}
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
            {row.original.schedules.map((s) => {
              const r = s.tashihRequest;
              return (
                <Badge
                  key={r.id + '-group'}
                  variant="outline"
                  className="w-fit text-muted-foreground"
                >
                  {`${r.groupName} - ${r.classroomName}`}
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
            set.add(`${s.tashihRequest.academicYear} ${s.tashihRequest.semester}`);
          });
          return Array.from(set).join(', ');
        },
        filterFn: (row, columnId, filterValue) => {
          const value = row.getValue(columnId) as string;
          return value.includes(filterValue);
        },
      },
      {
        id: 'Guru Pembimbing',
        header: 'Guru Pembimbing',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.schedules.map((s) => (
              <Badge
                key={s.tashihRequest.id + '-teacher'}
                variant="outline"
                className="w-fit text-muted-foreground"
              >
                {s.tashihRequest.teacher?.user.fullName ?? 'Belum ditentukan'}
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
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <>
      <div className="mb-4 w-[260px]">
        <Select
          value={selectedPeriod}
          onValueChange={(value) => {
            setSelectedPeriod(value);
            table
              .getColumn('Tahun Ajaran')
              ?.setFilterValue(value === 'ALL' ? undefined : value.replace('__', ' '));
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih Tahun Ajaran" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Tahun Ajaran</SelectItem>
            {academicPeriods.map((val) => {
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

      <DataTable title="Jadwal Tashih Saya" table={table} filterColumn="Tanggal" />
    </>
  );
}
