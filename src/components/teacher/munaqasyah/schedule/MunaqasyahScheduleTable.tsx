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
import { MunaqasyahStage, Semester } from '@prisma/client';
import { Label } from '@/components/ui/label';

interface MunaqasyahSchedule {
  id: string;
  date: string;
  sessionName: string;
  startTime: string;
  endTime: string;
  location: string;
  examiner: {
    id: string;
    nip: string;
    fullName: string;
  } | null;
  coordinator: {
    id: string;
    nip: string;
    fullName: string;
  } | null;
  scheduleRequests: {
    id: string;
    request: {
      id: string;
      stage: MunaqasyahStage;
      juz: { name: string };
      student: {
        nis: string;
        fullName: string;
      };
      teacher: {
        nip: string;
        fullName: string;
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
  }[];
}

interface MunaqasyahScheduleTableProps {
  data: MunaqasyahSchedule[];
}

const stageLabels = {
  TAHAP_1: 'Tahap 1',
  TAHAP_2: 'Tahap 2',
  TAHAP_3: 'Tahap 3',
  MUNAQASYAH: 'Munaqasyah',
};

export function MunaqasyahScheduleTable({ data }: MunaqasyahScheduleTableProps) {
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
  } = useDataTableState<MunaqasyahSchedule, string>();

  const [selectedStage, setSelectedStage] = useState<string | 'ALL'>('ALL');
  const [selectedYearSemester, setSelectedYearSemester] = useState<string | 'ALL'>('ALL');
  const [selectedGroupId, setSelectedGroupId] = useState<string | 'ALL'>('ALL');

  const stageOptions = useMemo(() => {
    const set = new Set<MunaqasyahStage>();
    for (const schedule of data) {
      for (const sr of schedule.scheduleRequests) {
        set.add(sr.request.stage);
      }
    }
    return Array.from(set);
  }, [data]);

  const yearSemesterOptions = useMemo(() => {
    const set = new Set<string>();
    for (const schedule of data) {
      for (const sr of schedule.scheduleRequests) {
        const r = sr.request;
        set.add(`${r.group.classroom.academicYear}__${r.group.classroom.semester}`);
      }
    }
    return Array.from(set);
  }, [data]);

  const groupOptions = useMemo(() => {
    const set = new Map<string, string>();
    for (const schedule of data) {
      for (const sr of schedule.scheduleRequests) {
        const r = sr.request;
        const key = `${r.group.name}-${r.group.classroom.name}`;
        set.set(key, `${r.group.name} - ${r.group.classroom.name}`);
      }
    }
    return Array.from(set.entries());
  }, [data]);

  const columns = useMemo<ColumnDef<MunaqasyahSchedule>[]>(
    () => [
      {
        accessorKey: 'date',
        id: 'Tanggal',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
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
        id: 'Lokasi',
        header: 'Lokasi',
      },
      {
        accessorKey: 'student',
        id: 'Siswa',
        header: 'Siswa',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.scheduleRequests.map((sr) => (
              <Badge key={sr.request.id} variant="outline" className="w-fit text-muted-foreground">
                {sr.request.student.fullName} ({sr.request.student.nis})
              </Badge>
            ))}
          </div>
        ),
      },
      {
        id: 'Kelompok',
        header: 'Kelompok',
        accessorFn: (row) => {
          return row.scheduleRequests
            .map((sr) => `${sr.request.group.name} - ${sr.request.group}`)
            .join(', ');
        },
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.scheduleRequests.map((sr) => (
              <Badge
                key={sr.request.id + '-group'}
                variant="outline"
                className="w-fit text-muted-foreground"
              >
                {sr.request.group.name} - {sr.request.group.classroom.name}
              </Badge>
            ))}
          </div>
        ),
        filterFn: (row, columnId, filterValue) => {
          const value = row.getValue(columnId) as string;
          return value.includes(filterValue);
        },
      },
      {
        id: 'Tahun Ajaran',
        header: 'Tahun Ajaran',
        accessorFn: (row) => {
          const set = new Set<string>();
          row.scheduleRequests.forEach((sr) => {
            const r = sr.request;
            set.add(`${r.group.classroom.academicYear} ${r.group.classroom.semester}`);
          });
          return Array.from(set).join(', ');
        },
        filterFn: (row, columnId, filterValue) => {
          const value = row.getValue(columnId) as string;
          return value.includes(filterValue);
        },
      },
      {
        accessorKey: 'juz',
        id: 'Juz',
        header: 'Juz',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.scheduleRequests.map((sr) => (
              <Badge
                key={sr.request.id + '-juz'}
                variant="outline"
                className="w-fit text-muted-foreground"
              >
                {sr.request.juz.name}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        id: 'Tahapan',
        header: 'Tahapan',
        accessorFn: (row) => {
          return row.scheduleRequests.map((sr) => stageLabels[sr.request.stage]).join(', ');
        },
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.scheduleRequests.map((sr) => (
              <Badge key={sr.request.id + '-stage'} variant="secondary" className="w-fit">
                {stageLabels[sr.request.stage]}
              </Badge>
            ))}
          </div>
        ),
        filterFn: (row, columnId, filterValue) => {
          const value = row.getValue(columnId) as string;
          return value.includes(filterValue);
        },
      },
      {
        accessorKey: 'examiner',
        id: 'Penguji',
        header: 'Penguji',
        cell: ({ row }) => (
          <div className="text-sm">
            {row.original.examiner ? (
              <div>
                <div className="font-medium">{row.original.examiner.fullName}</div>
                <div className="text-muted-foreground">{row.original.examiner.nip}</div>
              </div>
            ) : (
              <span className="text-muted-foreground">Koordinator Al-Qur&apos;an</span>
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
      <div className="flex flex-wrap gap-4 mb-4">
        <div>
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

        <div>
          <Label className="mb-2 block">Filter Kelompok</Label>
          <Select
            value={selectedGroupId}
            onValueChange={(value) => {
              setSelectedGroupId(value);
              table.getColumn('Kelompok')?.setFilterValue(value === 'ALL' ? undefined : value);
            }}
          >
            <SelectTrigger className="w-[250px]">
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
          <Label className="mb-2 block">Filter Tahapan</Label>
          <Select
            value={selectedStage}
            onValueChange={(value) => {
              setSelectedStage(value);
              table
                .getColumn('Tahap')
                ?.setFilterValue(
                  value === 'ALL' ? undefined : stageLabels[value as MunaqasyahStage]
                );
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Pilih Tahapan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Tahap</SelectItem>
              {stageOptions.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {stageLabels[stage]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable title="Jadwal Ujian Munaqasyah" table={table} filterColumn="Tanggal" />
    </>
  );
}
