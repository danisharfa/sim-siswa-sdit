'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
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
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { useDataTableState } from '@/lib/hooks/use-data-table';
import { Semester, TashihType } from '@prisma/client';
import { Card, CardContent } from '@/components/ui/card';
import { ExportToPDFButton } from './ExportToPDFButton';

export interface TashihSchedule {
  id: string;
  date: string;
  sessionName: string;
  startTime: string;
  endTime: string;
  location: string;
  schedules: {
    tashihRequest: {
      id: string;
      tashihType: TashihType;
      surah: { name: string } | null;
      juz: { name: string } | null;
      wafa: { name: string } | null;
      startPage: number | null;
      endPage: number | null;
      student: {
        nis: string;
        user: {
          fullName: string;
        };
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

interface TashihScheduleTableProps {
  data: TashihSchedule[];
  title: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function TashihScheduleTable({ data, title }: TashihScheduleTableProps) {
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
  } = useDataTableState<TashihSchedule, string>();

  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedTashihType, setSelectedTashihType] = useState('all');

  const { data: setting } = useSWR('/api/academicSetting', fetcher);

  const academicPeriods = useMemo(() => {
    const set = new Set<string>();
    for (const schedule of data) {
      for (const s of schedule.schedules) {
        set.add(
          `${s.tashihRequest.group.classroom.academicYear}-${s.tashihRequest.group.classroom.semester}`
        );
      }
    }
    return Array.from(set);
  }, [data]);

  const defaultPeriod = setting ? `${setting.currentYear}-${setting.currentSemester}` : '';

  const tashihTypeOptions = useMemo(() => {
    const set = new Set<TashihType>();
    for (const schedule of data) {
      for (const s of schedule.schedules) {
        set.add(s.tashihRequest.tashihType);
      }
    }
    return Array.from(set);
  }, [data]);

  useEffect(() => {
    if (defaultPeriod && !selectedPeriod) {
      if (academicPeriods.includes(defaultPeriod)) {
        setSelectedPeriod(defaultPeriod);
      } else if (academicPeriods.length > 0) {
        setSelectedPeriod(academicPeriods[0]);
      }
    }
  }, [defaultPeriod, academicPeriods, selectedPeriod]);

  // ===== EVENT HANDLERS =====
  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
    setSelectedTashihType('all');
    // Clear table filters
    table.getColumn('Jenis Tashih')?.setFilterValue(undefined);
  };

  const handleTashihTypeChange = (value: string) => {
    setSelectedTashihType(value);
    table.getColumn('Jenis Tashih')?.setFilterValue(value === 'all' ? undefined : value);
  };

  const currentPeriodInfo = useMemo(() => {
    if (!selectedPeriod) return null;

    const [academicYear, semester] = selectedPeriod.split('-');
    const foundSchedule = data.find((schedule) =>
      schedule.schedules.some(
        (s) =>
          s.tashihRequest.group.classroom.academicYear === academicYear &&
          s.tashihRequest.group.classroom.semester === semester
      )
    );

    if (foundSchedule) {
      const schedule = foundSchedule.schedules.find(
        (s) =>
          s.tashihRequest.group.classroom.academicYear === academicYear &&
          s.tashihRequest.group.classroom.semester === semester
      );

      if (schedule) {
        return {
          period: {
            academicYear,
            semester,
            className: schedule.tashihRequest.group.classroom.name,
            groupName: schedule.tashihRequest.group.name,
            teacherName: schedule.tashihRequest.teacher.user.fullName,
          },
        };
      }
    }

    return null;
  }, [selectedPeriod, data]);

  const filteredData = useMemo(() => {
    if (!selectedPeriod) return data;

    const [academicYear, semester] = selectedPeriod.split('-');
    return data.filter((schedule) =>
      schedule.schedules.some(
        (s) =>
          s.tashihRequest.group.classroom.academicYear === academicYear &&
          s.tashihRequest.group.classroom.semester === semester
      )
    );
  }, [data, selectedPeriod]);

  const columns = useMemo<ColumnDef<TashihSchedule>[]>(
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
        accessorKey: 'schedules',
        id: 'Jenis Tashih',
        header: 'Jenis Tashih',
        filterFn: (row) => {
          if (selectedTashihType === 'all') return true;
          return row.original.schedules.some(
            (s) => s.tashihRequest.tashihType === selectedTashihType
          );
        },
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.schedules.map((s) => {
              const r = s.tashihRequest;
              return (
                <Badge key={r.id + '-type'} variant="outline" className="w-fit">
                  {r.tashihType.replaceAll('_', ' ')}
                </Badge>
              );
            })}
          </div>
        ),
      },
      {
        accessorKey: 'schedules.tashihRequest.student.user.fullName',
        id: 'Materi',
        header: 'Materi',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.schedules.map((s) => {
              const r = s.tashihRequest;
              const materi =
                r.tashihType === TashihType.ALQURAN
                  ? `${r.surah?.name ?? '-'} (${r.juz?.name ?? '-'})`
                  : `${r.wafa?.name ?? '-'} (Hal ${r.startPage ?? '-'}${
                      r.endPage ? `–${r.endPage}` : ''
                    })`;
              return <span key={r.id + '-materi'}>{materi}</span>;
            })}
          </div>
        ),
      },
    ],
    [selectedTashihType]
  );

  const table = useReactTable({
    data: filteredData,
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
          <Label className="mb-2 block sr-only">Filter Tahun Akademik</Label>
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="min-w-[200px]">
              <SelectValue placeholder="Pilih Tahun Akademik" />
            </SelectTrigger>
            <SelectContent>
              {academicPeriods.map((period) => (
                <SelectItem key={period} value={period}>
                  {period.replace('-', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block sr-only">Filter Jenis Tashih</Label>
          <Select value={selectedTashihType} onValueChange={handleTashihTypeChange}>
            <SelectTrigger className="min-w-[180px]">
              <SelectValue placeholder="Pilih Jenis Tashih" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Jenis Tashih</SelectItem>
              {tashihTypeOptions.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.replaceAll('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ExportToPDFButton
          table={table}
          studentName={data[0]?.schedules[0]?.tashihRequest?.student?.user?.fullName}
          studentNis={data[0]?.schedules[0]?.tashihRequest?.student?.nis}
          academicYear={selectedPeriod ? selectedPeriod.replace('-', ' ') : ''}
        />
      </div>

      {currentPeriodInfo && (
        <Card>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Tahun Akademik</h4>
                <p className="font-semibold">
                  {currentPeriodInfo.period.academicYear} {currentPeriodInfo.period.semester}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Kelas</h4>
                <p className="font-semibold">{currentPeriodInfo.period.className}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Kelompok</h4>
                <p className="font-semibold">{currentPeriodInfo.period.groupName}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Guru Pembimbing</h4>
                <p className="font-semibold">{currentPeriodInfo.period.teacherName}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <DataTable title={title} table={table} showColumnFilter={false} />

      {selectedPeriod && filteredData.length === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center mt-4">
          <p className="text-muted-foreground">
            Tidak ada jadwal tashih untuk Tahun Akademik {selectedPeriod.replace('-', ' ')}.
          </p>
        </div>
      )}
    </>
  );
}
