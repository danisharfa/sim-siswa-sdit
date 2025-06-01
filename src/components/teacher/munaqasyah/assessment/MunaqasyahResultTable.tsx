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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useDataTableState } from '@/lib/hooks/use-data-table';
import { DataTable } from '@/components/ui/data-table';
import { Semester } from '@prisma/client';

interface MunaqasyahResult {
  id: string;
  stage: string;
  score: number;
  grade: string;
  passed: boolean;
  note?: string;
  academicYear: string;
  semester: Semester;
  classroomName: string;
  groupName: string;
  juz: { name: string };
  schedule: {
    date: string;
    sessionName: string;
    startTime: string;
    endTime: string;
    location: string;
  };
  student: {
    nis: string;
    user: { fullName: string };
  };
}

interface MunaqasyahResultTableProps {
  data: MunaqasyahResult[];
  title: string;
}

export function MunaqasyahResultTable({ data, title }: MunaqasyahResultTableProps) {
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
  } = useDataTableState<MunaqasyahResult, string>();

  const [selectedYearSemester, setSelectedYearSemester] = useState<string | 'ALL'>('ALL');

  const columns = useMemo<ColumnDef<MunaqasyahResult>[]>(
    () => [
      {
        id: 'Tanggal',
        header: 'Tanggal',
        cell: ({ row }) => {
          const s = row.original.schedule;
          const date = new Date(s.date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });
          return `${date} (${s.sessionName}, ${s.startTime} - ${s.endTime})`;
        },
      },
      {
        accessorKey: 'schedule.location',
        id: 'Lokasi',
        header: 'Lokasi',
      },
      {
        id: 'Siswa',
        header: 'Siswa',
        accessorFn: (row) => row.student.user.fullName,
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">{row.original.student.user.fullName}</div>
            <div className="text-muted-foreground">{row.original.student.nis}</div>
          </div>
        ),
      },
      {
        id: 'Tahun Ajaran',
        header: 'Tahun Ajaran',
        accessorFn: (row) => `${row.academicYear} ${row.semester}`,
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">
              {row.original.academicYear} {row.original.semester}
            </div>
            <div className="text-muted-foreground">
              {row.original.groupName} - {row.original.classroomName}
            </div>
          </div>
        ),
      },
      {
        id: 'Juz',
        header: 'Juz',
        cell: ({ row }) => <Badge variant="outline">{row.original.juz.name}</Badge>,
      },
      {
        id: 'Tahap',
        header: 'Tahap',
        cell: ({ row }) => <Badge variant="secondary">{row.original.stage}</Badge>,
      },
      {
        id: 'Nilai',
        header: 'Nilai',
        cell: ({ row }) => `${row.original.score} (${row.original.grade})`,
      },
      {
        id: 'Status',
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
        header: 'Catatan',
        cell: ({ row }) => row.original.note ?? '-',
      },
    ],
    []
  );

  const yearSemesterOptions = useMemo(() => {
    const set = new Set<string>();
    for (const d of data) {
      set.add(`${d.academicYear}__${d.semester}`);
    }
    return Array.from(set);
  }, [data]);

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
        <Label className="mb-2 block">Filter Tahun Ajaran</Label>
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

      <DataTable title={title} table={table} filterColumn="Siswa" />
    </>
  );
}
