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
import { DataTable } from '@/components/ui/data-table';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
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
    group?: {
      name: string;
      classroom: {
        name: string;
        academicYear: string;
        semester: Semester;
      };
    };
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
        id: 'Nama Siswa',
        header: 'Nama Siswa',
        cell: ({ row }) => row.original.student.user.fullName,
      },
      {
        id: 'NIS',
        header: 'NIS',
        cell: ({ row }) => row.original.student.nis,
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
      {
        id: 'Tahun Ajaran',
        header: 'Tahun Ajaran',
        accessorFn: (row) => `${row.academicYear} ${row.semester}`,
        cell: ({ row }) => (
          <Badge variant="outline" className="w-fit text-muted-foreground">
            {row.original.academicYear} {row.original.semester}
          </Badge>
        ),
      },
      {
        id: 'Kelompok',
        header: 'Kelompok',
        cell: ({ row }) => {
          const g = row.original.student.group;
          return g ? `${g.name} - ${g.classroom.name}` : 'Tidak terdaftar';
        },
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
        <Label>Filter Tahun Ajaran + Semester</Label>
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

      <DataTable title={title} table={table} filterColumn="Nama Siswa" />
    </>
  );
}
