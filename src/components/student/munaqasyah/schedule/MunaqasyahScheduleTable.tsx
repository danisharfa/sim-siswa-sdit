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
import { Card, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { useDataTableState } from '@/lib/hooks/use-data-table';
import { Semester, MunaqasyahStage, MunaqasyahBatch } from '@prisma/client';
import { ExportToPDFButton } from './ExportToPDFButton';

export type MunaqasyahSchedule = {
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
};

interface MunaqasyahScheduleTableProps {
  data: MunaqasyahSchedule[];
  title: string;
}

export function MunaqasyahScheduleTable({ data, title }: MunaqasyahScheduleTableProps) {
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
  } = useDataTableState<MunaqasyahSchedule, string>();

  const [selectedPeriod, setSelectedPeriod] = useState<string | 'ALL'>('ALL');
  const [selectedBatch, setSelectedBatch] = useState<string | 'ALL'>('ALL');
  const [selectedStage, setSelectedStage] = useState<string | 'ALL'>('ALL');
  const [selectedJuz, setSelectedJuz] = useState<string | 'ALL'>('ALL');

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

  // Extract unique juz
  const juzOptions = useMemo(() => {
    const set = new Set<string>();
    for (const schedule of data) {
      for (const sr of schedule.scheduleRequests) {
        set.add(sr.request.juz.name);
      }
    }
    return Array.from(set).sort();
  }, [data]);

  // ===== EVENT HANDLERS =====
  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
    setSelectedBatch('ALL');
    setSelectedStage('ALL');
    setSelectedJuz('ALL');
    // Clear table filters
    table.getColumn('Tanggal dan Waktu')?.setFilterValue(undefined);
  };

  const handleBatchChange = (value: string) => {
    setSelectedBatch(value);
  };

  const handleStageChange = (value: string) => {
    setSelectedStage(value);
  };

  const handleJuzChange = (value: string) => {
    setSelectedJuz(value);
  };

  // Filter data berdasarkan periode, batch, stage, juz yang dipilih
  const filteredData = useMemo(() => {
    return data.filter((schedule) => {
      // Filter by period
      if (selectedPeriod !== 'ALL') {
        const periodMatch = schedule.scheduleRequests.some((sr) => {
          const r = sr.request;
          const periodKey = `${r.group.classroom.academicYear}__${r.group.classroom.semester}`;
          return periodKey === selectedPeriod;
        });
        if (!periodMatch) return false;
      }

      // Filter by batch
      if (selectedBatch !== 'ALL') {
        const batchMatch = schedule.scheduleRequests.some(
          (sr) => sr.request.batch === selectedBatch
        );
        if (!batchMatch) return false;
      }

      // Filter by stage
      if (selectedStage !== 'ALL') {
        const stageMatch = schedule.scheduleRequests.some(
          (sr) => sr.request.stage === selectedStage
        );
        if (!stageMatch) return false;
      }

      // Filter by juz
      if (selectedJuz !== 'ALL') {
        const juzMatch = schedule.scheduleRequests.some(
          (sr) => sr.request.juz.name === selectedJuz
        );
        if (!juzMatch) return false;
      }

      return true;
    });
  }, [data, selectedPeriod, selectedStage, selectedBatch, selectedJuz]);

  const currentPeriodInfo = useMemo(() => {
    if (filteredData.length === 0) return null;

    const firstSchedule = filteredData[0];
    if (firstSchedule.scheduleRequests.length === 0) return null;

    const firstRequest = firstSchedule.scheduleRequests[0].request;
    return {
      academicYear: firstRequest.group.classroom.academicYear,
      semester: firstRequest.group.classroom.semester,
      className: firstRequest.group.classroom.name,
      groupName: firstRequest.group.name,
      teacherName: firstRequest.teacher.user.fullName,
    };
  }, [filteredData]);

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
        id: 'Batch',
        header: 'Batch',
        cell: ({ row }) => (
          <Badge variant="secondary">
            {row.original.scheduleRequests[0].request.batch.replaceAll('_', ' ')}
          </Badge>
        ),
      },
      {
        id: 'Stage',
        header: 'Tahap',
        cell: ({ row }) => (
          <Badge variant="default">
            {row.original.scheduleRequests[0].request.stage.replaceAll('_', ' ')}
          </Badge>
        ),
      },
      {
        id: 'Juz',
        header: 'Juz',
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.scheduleRequests[0].request.juz.name}</Badge>
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
    ],
    []
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
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Pilih Tahun Akademik" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Tahun Akademik</SelectItem>
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
          <Label className="mb-2 block sr-only">Filter Batch Munaqasyah</Label>
          <Select value={selectedBatch} onValueChange={handleBatchChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Pilih Batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Batch</SelectItem>
              {batchOptions.map((batch) => (
                <SelectItem key={batch} value={batch}>
                  {batch.replaceAll('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block sr-only">Filter Tahap Munaqasyah</Label>
          <Select value={selectedStage} onValueChange={handleStageChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Pilih Tahap" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Tahap</SelectItem>
              {stageOptions.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {stage.replaceAll('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block sr-only">Filter Juz</Label>
          <Select value={selectedJuz} onValueChange={handleJuzChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Pilih Juz" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Juz</SelectItem>
              {juzOptions.map((juz) => (
                <SelectItem key={juz} value={juz}>
                  {juz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ExportToPDFButton
          table={table}
          studentName={data[0]?.scheduleRequests[0]?.request?.student?.user?.fullName}
          studentNis={data[0]?.scheduleRequests[0]?.request?.student?.nis}
          academicYear={
            selectedPeriod !== 'ALL'
              ? selectedPeriod.replace('__', ' ')
              : currentPeriodInfo
              ? `${currentPeriodInfo.academicYear} ${currentPeriodInfo.semester}`
              : ''
          }
        />
      </div>

      {currentPeriodInfo && (
        <Card>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Tahun Akademik</h4>
                <p className="font-semibold">
                  {currentPeriodInfo.academicYear} {currentPeriodInfo.semester}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Kelas</h4>
                <p className="font-semibold">{currentPeriodInfo.className}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Kelompok</h4>
                <p className="font-semibold">{currentPeriodInfo.groupName}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Guru Pembimbing</h4>
                <p className="font-semibold">{currentPeriodInfo.teacherName}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <DataTable title={title} table={table} showColumnFilter={false} />
    </>
  );
}
