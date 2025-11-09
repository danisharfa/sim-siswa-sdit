'use client';

import { useMemo, useState, useEffect } from 'react';
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
import { MunaqasyahStage, MunaqasyahBatch, Semester } from '@prisma/client';
import { Label } from '@/components/ui/label';
import { ExportToPDFButton } from './ExportToPDFButton';
import useSWR from 'swr';

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
  coordinator: {
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
        nip: string;
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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function MunaqasyahScheduleTable({ data, title }: MunaqasyahScheduleTableProps) {
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
  } = useDataTableState<MunaqasyahSchedule, string>();

  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedJuz, setSelectedJuz] = useState('all');

  const { data: academicSetting } = useSWR('/api/academicSetting', fetcher);

  const defaultPeriod = academicSetting
    ? `${academicSetting.currentYear}-${academicSetting.currentSemester}`
    : '';

  // Extract teacher name from the first available schedule
  const teacherName = useMemo(() => {
    if (data.length > 0 && data[0].scheduleRequests.length > 0) {
      return data[0].scheduleRequests[0].request.teacher.user.fullName;
    }
    return '';
  }, [data]);

  const academicPeriods = useMemo(() => {
    const set = new Set<string>();
    for (const schedule of data) {
      for (const sr of schedule.scheduleRequests) {
        const r = sr.request;
        set.add(`${r.group.classroom.academicYear}-${r.group.classroom.semester}`);
      }
    }
    return Array.from(set);
  }, [data]);

  // Filter data by selected period first
  const filteredByPeriod = useMemo(() => {
    if (!selectedPeriod) return data;
    const [year, semester] = selectedPeriod.split('-');
    return data.filter((schedule) =>
      schedule.scheduleRequests.some(
        (sr) =>
          sr.request.group.classroom.academicYear === year &&
          sr.request.group.classroom.semester === semester
      )
    );
  }, [data, selectedPeriod]);

  // Available groups based on period filter
  const availableGroups = useMemo(() => {
    const groupMap = new Map<string, { id: string; name: string; classroom: { name: string } }>();
    filteredByPeriod.forEach((schedule) => {
      schedule.scheduleRequests.forEach((sr) => {
        const groupKey = `${sr.request.group.name}-${sr.request.group.classroom.name}`;
        if (!groupMap.has(groupKey)) {
          groupMap.set(groupKey, {
            id: groupKey,
            name: sr.request.group.name,
            classroom: { name: sr.request.group.classroom.name },
          });
        }
      });
    });
    return Array.from(groupMap.values());
  }, [filteredByPeriod]);

  // Available students based on group filter
  const availableStudents = useMemo(() => {
    if (selectedGroupId === 'all') return [];
    const students = new Set<string>();
    filteredByPeriod.forEach((schedule) => {
      schedule.scheduleRequests.forEach((sr) => {
        const groupKey = `${sr.request.group.name}-${sr.request.group.classroom.name}`;
        if (groupKey === selectedGroupId) {
          students.add(sr.request.student.user.fullName);
        }
      });
    });
    return Array.from(students).sort();
  }, [filteredByPeriod, selectedGroupId]);

  // Available batches
  const availableBatches = useMemo(() => {
    const batches = new Set<MunaqasyahBatch>();
    filteredByPeriod.forEach((schedule) => {
      schedule.scheduleRequests.forEach((sr) => {
        batches.add(sr.request.batch);
      });
    });
    return Array.from(batches);
  }, [filteredByPeriod]);

  // Available stages
  const availableStages = useMemo(() => {
    const stages = new Set<MunaqasyahStage>();
    filteredByPeriod.forEach((schedule) => {
      schedule.scheduleRequests.forEach((sr) => {
        stages.add(sr.request.stage);
      });
    });
    return Array.from(stages);
  }, [filteredByPeriod]);

  // Available juz
  const availableJuz = useMemo(() => {
    const juzSet = new Set<string>();
    filteredByPeriod.forEach((schedule) => {
      schedule.scheduleRequests.forEach((sr) => {
        juzSet.add(sr.request.juz.name);
      });
    });
    return Array.from(juzSet).sort();
  }, [filteredByPeriod]);

  useEffect(() => {
    if (defaultPeriod && !selectedPeriod && academicPeriods.length > 0) {
      const targetPeriod = academicPeriods.includes(defaultPeriod)
        ? defaultPeriod
        : academicPeriods[0];
      setSelectedPeriod(targetPeriod);
    }
  }, [defaultPeriod, academicPeriods, selectedPeriod]);

  // ===== EVENT HANDLERS =====
  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
    setSelectedGroupId('all');
    setSelectedStudent('all');
    setSelectedBatch('all');
    setSelectedStage('all');
    setSelectedJuz('all');
    // Clear table filters
    table.getColumn('Kelompok')?.setFilterValue(undefined);
    table.getColumn('Siswa')?.setFilterValue(undefined);
    table.getColumn('Batch')?.setFilterValue(undefined);
    table.getColumn('Tahapan')?.setFilterValue(undefined);
    table.getColumn('Juz')?.setFilterValue(undefined);
  };

  const handleGroupChange = (value: string) => {
    setSelectedGroupId(value);
    setSelectedStudent('all');

    if (value === 'all') {
      table.getColumn('Kelompok')?.setFilterValue(undefined);
    } else {
      table.getColumn('Kelompok')?.setFilterValue(value);
    }
    table.getColumn('Siswa')?.setFilterValue(undefined);
  };

  const handleStudentChange = (value: string) => {
    setSelectedStudent(value);
    table.getColumn('Siswa')?.setFilterValue(value === 'all' ? undefined : value);
  };

  const handleBatchChange = (value: string) => {
    setSelectedBatch(value);
    table
      .getColumn('Batch')
      ?.setFilterValue(value === 'all' ? undefined : batchLabels[value as MunaqasyahBatch]);
  };

  const handleStageChange = (value: string) => {
    setSelectedStage(value);
    table
      .getColumn('Tahapan')
      ?.setFilterValue(value === 'all' ? undefined : stageLabels[value as MunaqasyahStage]);
  };

  const handleJuzChange = (value: string) => {
    setSelectedJuz(value);
    table.getColumn('Juz')?.setFilterValue(value === 'all' ? undefined : value);
  };

  const columns = useMemo<ColumnDef<MunaqasyahSchedule>[]>(
    () => [
      {
        accessorKey: 'date',
        id: 'Tanggal',
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
        id: 'Siswa',
        header: 'Siswa',
        accessorFn: (row) => row.scheduleRequests[0].request.student.user.fullName,
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.scheduleRequests.map((s, i) => (
              <Badge key={i} variant="outline" className="w-fit ">
                {s.request.student.user.fullName} ({s.request.student.nis})
              </Badge>
            ))}
          </div>
        ),
        filterFn: (row, columnId, filterValue) => {
          const value = row.getValue(columnId) as string;
          return value.toLowerCase().includes(filterValue.toLowerCase());
        },
      },
      {
        id: 'Kelompok',
        header: 'Kelompok',
        accessorFn: (row) =>
          `${row.scheduleRequests[0].request.group.name}-${row.scheduleRequests[0].request.group.classroom.name}`,
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.scheduleRequests.map((s, i) => {
              const r = s.request;
              return (
                <Badge key={i} variant="outline" className="w-fit">
                  {r.group.name && r.group.classroom.name
                    ? `${r.group.name} - ${r.group.classroom.name}`
                    : 'Tidak terdaftar'}
                </Badge>
              );
            })}
          </div>
        ),
        filterFn: (row, columnId, filterValue) => {
          const value = row.getValue(columnId) as string;
          return value === filterValue;
        },
      },
      {
        id: 'Batch',
        header: 'Batch',
        accessorFn: (row) => {
          return row.scheduleRequests.map((sr) => batchLabels[sr.request.batch]).join(', ');
        },
        cell: ({ row }) => (
          <Badge variant="outline">
            {batchLabels[row.original.scheduleRequests[0].request.batch]}
          </Badge>
        ),
        filterFn: (row, columnId, filterValue) => {
          const value = row.getValue(columnId) as string;
          return value.includes(filterValue);
        },
      },
      {
        id: 'Tahapan Ujian',
        header: 'Tahapan Ujian',
        accessorFn: (row) => {
          return row.scheduleRequests.map((sr) => stageLabels[sr.request.stage]).join(', ');
        },
        cell: ({ row }) => (
          <Badge variant="outline">
            {stageLabels[row.original.scheduleRequests[0].request.stage]}
          </Badge>
        ),
        filterFn: (row, columnId, filterValue) => {
          const value = row.getValue(columnId) as string;
          return value.includes(filterValue);
        },
      },
      {
        id: 'Juz',
        header: 'Juz',
        accessorFn: (row) => row.scheduleRequests[0].request.juz.name,
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.scheduleRequests[0].request.juz.name}</Badge>
        ),
        filterFn: (row, columnId, filterValue) => {
          const value = row.getValue(columnId) as string;
          return value === filterValue;
        },
      },
      {
        id: 'Penguji',
        header: 'Penguji',
        cell: ({ row }) => {
          const examiner = row.original.examiner;
          return (
            <div className="text-sm">
              {examiner ? (
                <Badge variant="outline">{examiner.user.fullName}</Badge>
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
    data: filteredByPeriod,
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
          <Label className="mb-2 block sr-only">Filter Tahun Akademik</Label>
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Pilih Tahun Ajaran" />
            </SelectTrigger>
            <SelectContent>
              {academicPeriods.map((period) => {
                const [year, semester] = period.split('-');
                return (
                  <SelectItem key={period} value={period}>
                    {year} {semester}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block sr-only">Filter Kelompok</Label>
          <Select value={selectedGroupId} onValueChange={handleGroupChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Pilih Kelompok" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kelompok</SelectItem>
              {availableGroups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name} - {group.classroom.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block sr-only">Filter Siswa</Label>
          <Select value={selectedStudent} onValueChange={handleStudentChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Pilih Siswa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Siswa</SelectItem>
              {availableStudents.map((student) => (
                <SelectItem key={student} value={student}>
                  {student}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block sr-only">Filter Batch</Label>
          <Select value={selectedBatch} onValueChange={handleBatchChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Pilih Batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Batch</SelectItem>
              {availableBatches.map((batch) => (
                <SelectItem key={batch} value={batch}>
                  {batchLabels[batch]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block sr-only">Filter Tahapan</Label>
          <Select value={selectedStage} onValueChange={handleStageChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Pilih Tahapan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tahapan Ujian</SelectItem>
              {availableStages.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {stageLabels[stage]}
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
              <SelectItem value="all">Semua Juz</SelectItem>
              {availableJuz.map((juz) => (
                <SelectItem key={juz} value={juz}>
                  {juz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ExportToPDFButton
          table={table}
          teacherName={teacherName}
          academicYear={selectedPeriod ? selectedPeriod.replace('-', ' ') : ''}
        />
      </div>

      <DataTable title={title} table={table} showColumnFilter={false} />

      {selectedPeriod && filteredByPeriod.length === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center mt-4">
          <p className="text-muted-foreground">
            Tidak ada jadwal Munaqasyah untuk periode {selectedPeriod.replace('-', ' ')}.
          </p>
        </div>
      )}
    </>
  );
}
