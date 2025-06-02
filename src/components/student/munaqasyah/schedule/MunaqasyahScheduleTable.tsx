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
import { Semester, MunaqasyahStage } from '@prisma/client';
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

// Helper functions
const getStageLabel = (stage: MunaqasyahStage): string => {
  switch (stage) {
    case MunaqasyahStage.TAHAP_1:
      return 'Tahap 1';
    case MunaqasyahStage.TAHAP_2:
      return 'Tahap 2';
    case MunaqasyahStage.TAHAP_3:
      return 'Tahap 3';
    case MunaqasyahStage.MUNAQASYAH:
      return 'Munaqasyah';
    default:
      return stage;
  }
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
  const [selectedStage, setSelectedStage] = useState<MunaqasyahStage | 'ALL'>('ALL');

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

  const columns = useMemo<ColumnDef<MunaqasyahSchedule>[]>(
    () => [
      {
        id: 'Tanggal',
        accessorKey: 'date',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
        cell: ({ row }) => {
          const s = row.original;
          const date = new Date(s.date).toLocaleDateString('id-ID', {
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
        accessorKey: 'scheduleRequests.request.stage',
        id: 'Tahap & Juz',
        header: 'Tahap & Juz',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1 min-w-[120px]">
            {row.original.scheduleRequests.map((sr) => {
              const r = sr.request;
              return (
                <div key={r.id} className="flex flex-col gap-1">
                  <Badge variant="outline" className="text-xs w-fit">
                    {getStageLabel(r.stage)}
                  </Badge>
                  <Badge>{r.juz.name}</Badge>
                </div>
              );
            })}
          </div>
        ),
      },
      {
        accessorKey: 'scheduleRequests.examiner.user.fullName',
        id: 'penguji',
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
                  {sr.request.teacher.user.fullName}
                </div>
              </div>
            ))}
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
          <Label className="mb-2 block">Filter Stage</Label>
          <Select
            value={selectedStage}
            onValueChange={(value) => {
              setSelectedStage(value as MunaqasyahStage | 'ALL');
              table
                .getColumn('Stage')
                ?.setFilterValue(
                  value === 'ALL' ? undefined : getStageLabel(value as MunaqasyahStage)
                );
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Tahap</SelectItem>
              {stageOptions.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {getStageLabel(stage)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <DataTable title="Jadwal Munaqasyah Saya" table={table} filterColumn="Tanggal" />
    </>
  );
}
