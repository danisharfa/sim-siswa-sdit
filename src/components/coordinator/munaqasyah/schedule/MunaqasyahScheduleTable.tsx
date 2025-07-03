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
import { MunaqasyahBatch, MunaqasyahStage, Semester } from '@prisma/client';

interface MunaqasyahSchedule {
  id: string;
  date: string;
  sessionName: string;
  startTime: string;
  endTime: string;
  location: string;
  examiner?: { user?: { fullName: string } };
  scheduleRequests: {
    request: {
      batch: MunaqasyahBatch;
      stage: MunaqasyahStage;
      student: {
        nis: string;
        user: { fullName: string };
      };
      teacher: { user: { fullName: string } };
      group: {
        name: string;
        classroom: {
          name: string;
          academicYear: string;
          semester: Semester;
        };
      };
      juz: { name: string };
    };
  }[];
}

interface Props {
  data: MunaqasyahSchedule[];
  title: string;
}

export function MunaqasyahScheduleTable({ data, title }: Props) {
  const {
    sorting,
    setSorting,
    columnVisibility,
    setColumnVisibility,
    columnFilters,
    setColumnFilters,
  } = useDataTableState<MunaqasyahSchedule, string>();

  const [selectedYearSemester, setSelectedYearSemester] = useState<string | 'ALL'>('ALL');

  const yearSemesterOptions = useMemo(() => {
    const set = new Set<string>();
    for (const schedule of data) {
      for (const s of schedule.scheduleRequests) {
        set.add(`${s.request.group.classroom.academicYear}__${s.request.group.classroom.semester}`);
      }
    }
    return Array.from(set);
  }, [data]);

  const columns = useMemo<ColumnDef<MunaqasyahSchedule>[]>(
    () => [
      {
        id: 'Waktu & Tempat',
        accessorKey: 'date',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Waktu & Tempat" />,
        cell: ({ row }) => {
          const s = row.original;
          const date = new Date(s.date).toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });
          return (
            <div className="text-sm min-w-[180px]">
              <div className="font-medium">{date}</div>
              <div className="text-muted-foreground">{s.sessionName}</div>
              <div className="text-muted-foreground text-xs">
                {s.startTime} - {s.endTime}
              </div>
              <div className="text-muted-foreground text-xs">📍 {s.location}</div>
            </div>
          );
        },
      },
      {
        accessorKey: 'scheduleRequests.request.student.user.fullName',
        id: 'Siswa',
        header: 'Siswa',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.scheduleRequests.map((s, i) => (
              <Badge key={i} variant="outline" className="w-fit text-muted-foreground">
                {s.request.student.user.fullName} ({s.request.student.nis})
              </Badge>
            ))}
          </div>
        ),
      },
      {
        accessorKey: 'scheduleRequests.request.group.name',
        id: 'Kelompok',
        header: 'Kelompok',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.scheduleRequests.map((s, i) => (
              <Badge key={i} variant="outline" className="w-fit text-muted-foreground">
                {`${s.request.group.name} - ${s.request.group.classroom.name}`}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        accessorKey: 'scheduleRequests.request.group.classroom.academicYear',
        id: 'Tahun Ajaran',
        header: 'Tahun Ajaran',
        accessorFn: (row) => {
          const set = new Set<string>();
          row.scheduleRequests.forEach((s) => {
            set.add(
              `${s.request.group.classroom.academicYear} ${s.request.group.classroom.semester}`
            );
          });
          return Array.from(set).join(', ');
        },
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.scheduleRequests.map((s, i) => (
              <Badge key={i} variant="outline" className="w-fit text-muted-foreground">
                {`${s.request.group.classroom.academicYear} ${s.request.group.classroom.semester}`}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        accessorKey: 'schedulesRequests.request.teacher.user.fullName',
        id: 'Guru Pembimbing',
        header: 'Guru Pembimbing',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.scheduleRequests.map((s, i) => (
              <Badge key={i} variant="secondary" className="w-fit">
                {s.request.teacher.user.fullName}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        accessorKey: 'scheduleRequests.request.juz.name',
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
        accessorKey: 'scheduleRequests.request.batch',
        id: 'Batch',
        header: 'Batch',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.scheduleRequests.map((s, i) => (
              <Badge key={i} variant="outline" className="w-fit text-muted-foreground">
                {s.request.batch.replace('_', ' ')}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        accessorKey: 'scheduleRequests.request.stage',
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
        accessorKey: 'examiner',
        id: 'Penguji',
        header: 'Penguji',
        cell: ({ row }) => (
          <div className="text-sm">
            {row.original.examiner ? (
              <div>
                <div className="font-medium">{row.original.examiner.user?.fullName}</div>
              </div>
            ) : (
              <span className="text-medium">Koordinator Al-Qur&apos;an</span>
            )}
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

      <DataTable title={title} table={table} />
    </>
  );
}
