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
    student: {
      nis: string;
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

  const [selectedYearSemester, setSelectedYearSemester] = useState<string | 'ALL'>('ALL');
  const [selectedGroupId, setSelectedGroupId] = useState<string | 'ALL'>('ALL');
  const [selectedStudent, setSelectedStudent] = useState<string | 'ALL'>('ALL');

  const yearSemesterOptions = useMemo(() => {
    const set = new Set<string>();
    for (const result of data) {
      const r = result.tashihRequest;
      set.add(`${r.group.classroom.academicYear}__${r.group.classroom.semester}`);
    }
    return Array.from(set);
  }, [data]);

  const groupOptions = useMemo(() => {
    const set = new Map<string, string>();
    for (const result of data) {
      const r = result.tashihRequest;
      const key = `${r.group.name}-${r.group.classroom.name}`;
      set.set(key, `${r.group.name} - ${r.group.classroom.name}`);
    }
    return Array.from(set.entries());
  }, [data]);

  const filteredStudents = useMemo(() => {
    if (selectedGroupId === 'ALL') return [];
    return Array.from(
      new Set(
        data
          .filter((result) => {
            const r = result.tashihRequest;
            return `${r.group.name} - ${r.group.classroom.name}` === selectedGroupId;
          })
          .map((result) => result.tashihRequest.student.user.fullName)
      )
    );
  }, [selectedGroupId, data]);

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
        id: 'Kelompok',
        header: 'Kelompok',
        accessorFn: (row) =>
          `${row.tashihRequest.group.name} - ${row.tashihRequest.group.classroom.name}`,
      },
      {
        id: 'Tahun Ajaran',
        header: 'Tahun Ajaran',
        accessorFn: (row) =>
          `${row.tashihRequest.group.classroom.academicYear} ${row.tashihRequest.group.classroom.semester}`,
      },
      {
        accessorKey: 'tashihRequest.tashihType',
        id: 'Materi',
        header: 'Materi',
        cell: ({ row }) => {
          const r = row.original.tashihRequest;
          return (
            <Badge variant="outline">
              {r.tashihType === TashihType.ALQURAN
                ? `${r.surah?.name ?? '-'} (${r.juz?.name ?? '-'})`
                : `${r.wafa?.name ?? '-'} (Hal ${r.startPage ?? '-'}${
                    r.endPage ? `–${r.endPage}` : ''
                  })`}
            </Badge>
          );
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
      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <Label className="mb-2 block">Filter Tahun Ajaran</Label>
          <Select
            value={selectedYearSemester}
            onValueChange={(val) => {
              setSelectedYearSemester(val);
              setSelectedGroupId('ALL');
              setSelectedStudent('ALL');
              table
                .getColumn('Tahun Ajaran')
                ?.setFilterValue(val === 'ALL' ? undefined : val.replace('__', ' '));
              table.getColumn('Kelompok')?.setFilterValue(undefined);
              table.getColumn('Siswa')?.setFilterValue(undefined);
            }}
          >
            <SelectTrigger className="min-w-[220px]">
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

        <div>
          <Label className="mb-2 block">Filter Kelompok</Label>
          <Select
            value={selectedGroupId}
            disabled={selectedYearSemester === 'ALL'}
            onValueChange={(val) => {
              setSelectedGroupId(val);
              setSelectedStudent('ALL');
              table.getColumn('Kelompok')?.setFilterValue(val === 'ALL' ? undefined : val);
              table.getColumn('Siswa')?.setFilterValue(undefined);
            }}
          >
            <SelectTrigger className="min-w-[250px]">
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

        <div>
          <Label className="mb-2 block">Filter Siswa</Label>
          <Select
            value={selectedStudent}
            disabled={selectedGroupId === 'ALL'}
            onValueChange={(val) => {
              setSelectedStudent(val);
              table.getColumn('Siswa')?.setFilterValue(val === 'ALL' ? undefined : val);
            }}
          >
            <SelectTrigger className="min-w-[220px]">
              <SelectValue placeholder="Pilih Siswa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Siswa</SelectItem>
              {filteredStudents.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable title="Hasil Ujian Siswa Bimbingan" table={table} filterColumn="Siswa" />
    </>
  );
}
