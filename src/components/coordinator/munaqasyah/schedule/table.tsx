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
import { Semester } from '@prisma/client';

interface MunaqosyahSchedule {
  id: string;
  date: string;
  sessionName: string;
  startTime: string;
  endTime: string;
  location: string;
  examiner?: { user?: { fullName: string } };
  scheduleRequests: {
    request: {
      student: {
        nis: string;
        user: { fullName: string };
        group?: {
          name: string;
          classroom: { name: string; academicYear: string; semester: Semester };
        };
      };
      stage: string;
      juz: { name: string };
    };
  }[];
}

interface Props {
  data: MunaqosyahSchedule[];
  title: string;
}

export function MunaqosyahScheduleTable({ data, title }: Props) {
  const {
    sorting,
    setSorting,
    columnVisibility,
    setColumnVisibility,
    columnFilters,
    setColumnFilters,
  } = useDataTableState<MunaqosyahSchedule, string>();

  const [selectedYearSemester, setSelectedYearSemester] = useState<string | 'ALL'>('ALL');

  const yearSemesterOptions = useMemo(() => {
    const set = new Set<string>();
    for (const schedule of data) {
      for (const s of schedule.scheduleRequests) {
        const g = s.request.student.group;
        if (g) {
          set.add(`${g.classroom.academicYear}__${g.classroom.semester}`);
        }
      }
    }
    return Array.from(set);
  }, [data]);

  const columns = useMemo<ColumnDef<MunaqosyahSchedule>[]>(
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
        cell: ({ row }) => row.original.scheduleRequests.length,
      },
      {
        id: 'Siswa',
        header: 'Siswa',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.scheduleRequests.map((s, i) => (
              <Badge key={i} variant="outline" className="w-fit text-muted-foreground">
                {s.request.student.user.fullName}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        id: 'Juz',
        header: 'Juz',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.scheduleRequests.map((s, i) => (
              <Badge key={i} variant="outline" className="w-fit text-muted-foreground">
                {s.request.juz?.name ?? '-'}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        id: 'Kelompok',
        header: 'Kelompok',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.scheduleRequests.map((s, i) => {
              const group = s.request.student.group;
              return (
                <Badge key={i} variant="outline" className="w-fit text-muted-foreground">
                  {group ? `${group.name} - ${group.classroom.name}` : 'Tidak terdaftar'}
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
          row.scheduleRequests.forEach((s) => {
            const group = s.request.student.group;
            if (group) {
              set.add(`${group.classroom.academicYear} ${group.classroom.semester}`);
            }
          });
          return Array.from(set).join(', ');
        },
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.scheduleRequests.map((s, i) => {
              const group = s.request.student.group;
              return (
                <Badge key={i} variant="outline" className="w-fit text-muted-foreground">
                  {group ? `${group.classroom.academicYear} ${group.classroom.semester}` : '-'}
                </Badge>
              );
            })}
          </div>
        ),
      },
      {
        id: 'Tahap',
        header: 'Tahap',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.scheduleRequests.map((s, i) => (
              <Badge key={i} variant="outline" className="w-fit text-muted-foreground">
                {s.request.stage.replace('TAHAP_', 'Tahap ') === 'MUNAQASYAH'
                  ? 'Munaqasyah'
                  : s.request.stage.replace('TAHAP_', 'Tahap ')}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        id: 'Penguji',
        header: 'Penguji',
        cell: ({ row }) => row.original.examiner?.user?.fullName ?? '-',
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
        <Label>Tahun Ajaran</Label>
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
