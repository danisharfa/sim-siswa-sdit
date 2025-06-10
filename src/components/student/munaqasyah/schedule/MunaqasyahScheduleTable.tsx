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
import { Semester, MunaqasyahStage, MunaqasyahBatch } from '@prisma/client';
import { Label } from '@/components/ui/label';

interface MunaqasyahSchedule {
  id: string;
  date: string;
  sessionName: string;
  startTime: string;
  endTime: string;
  location: string;
  examiner: {
    user: { fullName: string };
  } | null;
  scheduleRequests: {
    id: string;
    request: {
      id: string;
      batch: MunaqasyahBatch;
      stage: MunaqasyahStage;
      juz: { name: string };
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
  }[];
}

interface MunaqasyahScheduleTableProps {
  data: MunaqasyahSchedule[];
}

const batchLabels: Record<MunaqasyahBatch, string> = {
  [MunaqasyahBatch.TAHAP_1]: 'Tahap 1',
  [MunaqasyahBatch.TAHAP_2]: 'Tahap 2',
  [MunaqasyahBatch.TAHAP_3]: 'Tahap 3',
  [MunaqasyahBatch.TAHAP_4]: 'Tahap 4',
};

const stageLabels: Record<MunaqasyahStage, string> = {
  [MunaqasyahStage.TASMI]: 'Tasmi',
  [MunaqasyahStage.MUNAQASYAH]: 'Munaqasyah',
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

  const [selectedPeriod, setSelectedPeriod] = useState<string | 'ALL'>('ALL');
  const [selectedStage, setSelectedStage] = useState<string | 'ALL'>('ALL');
  const [selectedBatch, setSelectedBatch] = useState<string | 'ALL'>('ALL');

  // Extract unique academic periods
  const academicPeriods = useMemo(() => {
    const set = new Set<string>();
    for (const schedule of data) {
      for (const sr of schedule.scheduleRequests) {
        const r = sr.request;
        set.add(`${r.group.classroom.academicYear}__${r.group.classroom.semester}`);
      }
    }
    return Array.from(set).sort();
  }, [data]);

  // Extract unique stages
  const stageOptions = useMemo(() => {
    const set = new Set<MunaqasyahStage>();
    for (const schedule of data) {
      for (const sr of schedule.scheduleRequests) {
        set.add(sr.request.stage);
      }
    }
    return Array.from(set);
  }, [data]);

  // Extract unique batches
  const batchOptions = useMemo(() => {
    const set = new Set<MunaqasyahBatch>();
    for (const schedule of data) {
      for (const sr of schedule.scheduleRequests) {
        set.add(sr.request.batch);
      }
    }
    return Array.from(set);
  }, [data]);

  const columns = useMemo<ColumnDef<MunaqasyahSchedule>[]>(
    () => [
      {
        id: 'Tanggal',
        accessorKey: 'date',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
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
        id: 'Batch & Tahap',
        header: 'Batch & Tahap',
        accessorFn: (row) => {
          return row.scheduleRequests
            .map((sr) => `${batchLabels[sr.request.batch]} - ${stageLabels[sr.request.stage]}`)
            .join(', ');
        },
        cell: ({ row }) => (
          <div className="flex flex-col gap-1 min-w-[140px]">
            {row.original.scheduleRequests.map((sr) => {
              const r = sr.request;
              return (
                <div key={r.id} className="flex flex-col gap-1">
                  <Badge variant="secondary" className="text-xs w-fit">
                    {batchLabels[r.batch]}
                  </Badge>
                  <Badge variant="outline" className="text-xs w-fit">
                    {stageLabels[r.stage]}
                  </Badge>
                </div>
              );
            })}
          </div>
        ),
        filterFn: (row, columnId, filterValue) => {
          const value = row.getValue(columnId) as string;
          return value.toLowerCase().includes(filterValue.toLowerCase());
        },
      },
      {
        id: 'Juz',
        header: 'Juz',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.scheduleRequests.map((sr) => (
              <Badge key={sr.request.id + '-juz'} variant="default" className="w-fit">
                {sr.request.juz.name}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        id: 'Penguji',
        header: 'Penguji',
        cell: ({ row }) => {
          const examiner = row.original.examiner;
          return (
            <div className="text-sm">
              {examiner ? (
                <Badge variant="secondary">{examiner.user.fullName}</Badge>
              ) : (
                <span className="text-muted-foreground text-xs">Koordinator Al-Qur&apos;an</span>
              )}
            </div>
          );
        },
      },
      {
        id: 'Info Akademik',
        header: 'Info Akademik',
        accessorFn: (row) =>
          row.scheduleRequests
            .map(
              (sr) =>
                `${sr.request.group.classroom.academicYear} ${sr.request.group.classroom.semester}`
            )
            .join(', '),
        cell: ({ row }) => (
          <div className="text-sm min-w-[160px]">
            {row.original.scheduleRequests.map((sr) => (
              <div key={sr.request.id + '-period'} className="mb-2 last:mb-0">
                <div className="font-medium text-xs">
                  📅 {sr.request.group.classroom.academicYear} {sr.request.group.classroom.semester}
                </div>
                <div className="text-muted-foreground text-xs">
                  🏫 {sr.request.group.classroom.name}
                </div>
                <div className="text-muted-foreground text-xs">👥 {sr.request.group.name}</div>
                <div className="text-muted-foreground text-xs">
                  👨‍🏫 {sr.request.teacher.user.fullName}
                </div>
              </div>
            ))}
          </div>
        ),
        filterFn: (row, columnId, filterValue) => {
          const value = row.getValue(columnId) as string;
          return value.includes(filterValue);
        },
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
      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <Label className="mb-2 block">Filter Tahun Ajaran</Label>
          <Select
            value={selectedPeriod}
            onValueChange={(value) => {
              setSelectedPeriod(value);
              table
                .getColumn('Info Akademik')
                ?.setFilterValue(value === 'ALL' ? undefined : value.replace('__', ' '));
            }}
          >
            <SelectTrigger className="w-[250px]">
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

        <div>
          <Label className="mb-2 block">Filter Batch</Label>
          <Select
            value={selectedBatch}
            onValueChange={(value) => {
              setSelectedBatch(value);
              table
                .getColumn('Batch & Tahap')
                ?.setFilterValue(
                  value === 'ALL' ? undefined : batchLabels[value as MunaqasyahBatch]
                );
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Pilih Batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Batch</SelectItem>
              {batchOptions.map((batch) => (
                <SelectItem key={batch} value={batch}>
                  {batchLabels[batch]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block">Filter Tahap</Label>
          <Select
            value={selectedStage}
            onValueChange={(value) => {
              setSelectedStage(value);
              table
                .getColumn('Batch & Tahap')
                ?.setFilterValue(
                  value === 'ALL' ? undefined : stageLabels[value as MunaqasyahStage]
                );
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Pilih Tahap" />
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

      <DataTable title="Jadwal Munaqasyah Saya" table={table} filterColumn="Tanggal" />
    </>
  );
}