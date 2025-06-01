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
import { useDataTableState } from '@/lib/hooks/use-data-table';
import { DataTable } from '@/components/ui/data-table';
import { Semester, TashihType } from '@prisma/client';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';

interface TashihResult {
  id: string;
  passed: boolean;
  notes: string | null;
  tashihRequest: {
    tashihType: TashihType;
    surah: { name: string } | null;
    juz: { name: string } | null;
    wafa: { name: string } | null;
    startPage: number | null;
    endPage: number | null;
    teacher: { user: { fullName: string } | null };
    group: {
      name: string;
      classroom: {
        name: string;
        academicYear: string;
        semester: Semester;
      };
    };
  };
  tashihSchedule: {
    date: string;
    sessionName: string;
    startTime: string;
    endTime: string;
    location: string;
  };
}

interface Props {
  data: TashihResult[];
}

export function TashihResultTable({ data }: Props) {
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
  } = useDataTableState<TashihResult, string>();

  const [selectedPeriod, setSelectedPeriod] = useState('all');

  const academicPeriods = useMemo(() => {
    return Array.from(
      new Set(
        data.map(
          (d) =>
            `${d.tashihRequest.group.classroom.academicYear}-${d.tashihRequest.group.classroom.semester}`
        )
      )
    );
  }, [data]);

  const columns = useMemo<ColumnDef<TashihResult>[]>(
    () => [
      {
        id: 'Tanggal',
        accessorKey: 'tashihSchedule.date',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
        cell: ({ row }) => {
          const s = row.original.tashihSchedule;
          const date = new Date(s.date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });
          return `${date} (${s.sessionName}, ${s.startTime} - ${s.endTime})`;
        },
      },
      {
        accessorKey: 'tashihSchedule.location',
        id: 'Lokasi',
        header: 'Lokasi',
      },
      {
        id: 'Materi',
        header: 'Materi Ujian',
        accessorFn: (row) => {
          const r = row.tashihRequest;
          return r.tashihType === 'ALQURAN'
            ? `${r.surah?.name ?? '-'} (${r.juz?.name ?? '-'})`
            : `${r.wafa?.name ?? '-'} (Hal ${r.startPage ?? '-'}${
                r.endPage ? `–${r.endPage}` : ''
              })`;
        },
        cell: ({ row }) => {
          const r = row.original.tashihRequest;
          return (
            <Badge variant="outline">
              {r.tashihType === 'ALQURAN'
                ? `${r.surah?.name ?? '-'} (${r.juz?.name ?? '-'})`
                : `${r.wafa?.name ?? '-'} (Hal ${r.startPage ?? '-'}${
                    r.endPage ? `–${r.endPage}` : ''
                  })`}
            </Badge>
          );
        },
      },
      {
        id: 'Tahun Ajaran',
        header: 'Tahun Ajaran',
        accessorFn: (row) =>
          `${row.tashihRequest.group.classroom.academicYear} ${row.tashihRequest.group.classroom.semester}`,
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">
              {row.original.tashihRequest.group.classroom.academicYear}{' '}
              {row.original.tashihRequest.group.classroom.semester}
            </div>
            <div className="text-muted-foreground">
              {row.original.tashihRequest.group.name} -{' '}
              {row.original.tashihRequest.group.classroom.name}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'tashihRequest.teacher.user.fullName',
        id: 'Guru Pembimbing',
        header: 'Guru Pembimbing',
        cell: ({ row }) => (
          <Badge variant="secondary">
            {row.original.tashihRequest.teacher.user?.fullName || '-'}
          </Badge>
        ),
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
          onValueChange={(val) => {
            setSelectedPeriod(val);
            table
              .getColumn('Tahun Ajaran')
              ?.setFilterValue(val === 'all' ? undefined : val.replace('-', ' '));
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih Tahun Ajaran" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tahun Ajaran</SelectItem>
            {academicPeriods.map((p) => (
              <SelectItem key={p} value={p}>
                {p.replace('-', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable title="Hasil Tashih Saya" table={table} filterColumn="Materi" />
    </>
  );
}
