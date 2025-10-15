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
import { Badge } from '@/components/ui/badge';
import { useDataTableState } from '@/lib/hooks/use-data-table';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { DataTable } from '@/components/ui/data-table';
import { Semester, TashihType } from '@prisma/client';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface TashihResult {
  id: string;
  passed: boolean;
  notes?: string;
  tashihRequest: {
    tashihType: TashihType;
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
  tashihSchedule: {
    date: string;
    sessionName: string;
    startTime: string;
    endTime: string;
    location: string;
  };
}

interface TashihResultTableProps {
  data: TashihResult[];
  title: string;
}

export function TashihResultTable({ data, title }: TashihResultTableProps) {
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
  } = useDataTableState<TashihResult, string>();
  const [selectedYearSemester, setSelectedYearSemester] = useState<string | 'ALL'>('ALL');

  const yearSemesterOptions = useMemo(() => {
    const set = new Set<string>();
    for (const d of data) {
      const r = d.tashihRequest;
      if (r.group.classroom.academicYear && r.group.classroom.semester) {
        set.add(`${r.group.classroom.academicYear}__${r.group.classroom.semester}`);
      }
    }
    return Array.from(set);
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
        id: 'Siswa',
        header: 'Siswa',
        accessorFn: (row) => row.tashihRequest.student.user.fullName,
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">{row.original.tashihRequest.student.user.fullName}</div>
            <div className="text-muted-foreground">{row.original.tashihRequest.student.nis}</div>
          </div>
        ),
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
          <Badge variant="secondary" className="w-fit">
            {row.original.tashihRequest.teacher.user.fullName}
          </Badge>
        ),
      },
      {
        accessorKey: 'tashihRequest.tashihType',
        id: 'Materi',
        header: 'Materi',
        cell: ({ row }) => {
          const r = row.original.tashihRequest;
          if (r.tashihType === TashihType.ALQURAN) {
            return (
              <Badge variant="outline">{`${r.surah?.name ?? '-'} (${r.juz?.name ?? '-'})`}</Badge>
            );
          } else {
            return (
              <Badge variant="outline">
                {`${r.wafa?.name ?? '-'} (Hal ${r.startPage ?? '-'}${
                  r.startPage !== r.endPage ? `–${r.endPage}` : ''
                })`}
              </Badge>
            );
          }
        },
      },
      {
        id: 'Status',
        accessorKey: 'passed',
        header: 'Status',
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

  return (
    <>
      <div className="mb-4">
        <Label className="mb-2 block">Filter Tahun Akademik</Label>
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
            <SelectValue placeholder="Pilih Tahun Ajaran & Semester" />
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
      <DataTable title={title} table={table} filterColumn="Siswa" />
    </>
  );
}
