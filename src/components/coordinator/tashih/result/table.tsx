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
    academicYear: string;
    semester: Semester;
    classroomName: string;
    groupName: string;
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
      if (r.academicYear && r.semester) {
        set.add(`${r.academicYear}__${r.semester}`);
      }
    }
    return Array.from(set);
  }, [data]);

  const columns = useMemo<ColumnDef<TashihResult>[]>(
    () => [
      {
        id: 'Tanggal',
        accessorKey: 'tashihSchedule.date',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal Ujian" />,
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
        id: 'Lokasi',
        accessorKey: 'tashihSchedule.location',
        header: 'Lokasi',
      },
      {
        id: 'Nama Siswa',
        accessorKey: 'tashihRequest.student.user.fullName',
        header: 'Nama Siswa',
        cell: ({ row }) => row.original.tashihRequest.student.user.fullName,
      },
      {
        id: 'Materi',
        header: 'Materi Ujian',
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
        id: 'Kelompok',
        header: 'Kelompok',
        cell: ({ row }) => {
          const r = row.original.tashihRequest;
          return r.groupName && r.classroomName
            ? `${r.groupName} - ${r.classroomName}`
            : 'Tidak terdaftar';
        },
      },
      {
        id: 'Tahun Ajaran',
        header: 'Tahun Ajaran',
        accessorFn: (row) =>
          row.tashihRequest.academicYear && row.tashihRequest.semester
            ? `${row.tashihRequest.academicYear} ${row.tashihRequest.semester}`
            : '-',
        cell: ({ row }) => {
          const r = row.original.tashihRequest;
          return (
            <Badge variant="outline" className="w-fit text-muted-foreground">
              {r.academicYear && r.semester ? `${r.academicYear} ${r.semester}` : '-'}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'tashihRequest.teacher.user.fullName',
        id: 'Guru',
        header: 'Guru Pembimbing',
        cell: ({ row }) => (
          <Badge variant="secondary" className="w-fit">
            {row.original.tashihRequest.teacher.user.fullName}
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
