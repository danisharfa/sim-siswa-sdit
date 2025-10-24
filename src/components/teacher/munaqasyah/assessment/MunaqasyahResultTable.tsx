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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useDataTableState } from '@/lib/hooks/use-data-table';
import { DataTable } from '@/components/ui/data-table';
import { Semester, MunaqasyahStage, MunaqasyahBatch } from '@prisma/client';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { ExportToPDFButton } from './ExportToPDFButton';
import useSWR from 'swr';

export interface MunaqasyahResult {
  id: string;
  score: number;
  grade: string;
  passed: boolean;
  academicYear: string;
  semester: Semester;
  classroomName: string;
  groupName: string;
  batch: MunaqasyahBatch;
  stage: MunaqasyahStage;
  juz: { name: string };
  schedule: {
    date: string;
    sessionName: string;
    startTime: string;
    endTime: string;
    location: string;
  };
  student: {
    nis: string;
    user: { fullName: string };
  };
  teacher?: {
    nip: string;
    user: { fullName: string };
  };
  scoreDetails?: {
    tasmi?: {
      totalScore: number;
    } | null;
    munaqasyah?: {
      totalScore: number;
    } | null;
  };
  finalResult?: {
    finalScore: number;
    finalGrade: string;
    passed: boolean;
  } | null;
}

interface MunaqasyahResultTableProps {
  data: MunaqasyahResult[];
  title: string;
}

const gradeLabels: Record<string, string> = {
  MUMTAZ: 'Mumtaz',
  JAYYID_JIDDAN: 'Jayyid Jiddan',
  JAYYID: 'Jayyid',
  TIDAK_LULUS: 'Tidak Lulus',
};

const stageLabels: Record<MunaqasyahStage, string> = {
  [MunaqasyahStage.TASMI]: 'Tasmi',
  [MunaqasyahStage.MUNAQASYAH]: 'Munaqasyah',
};

const batchLabels: Record<MunaqasyahBatch, string> = {
  [MunaqasyahBatch.TAHAP_1]: 'Tahap 1',
  [MunaqasyahBatch.TAHAP_2]: 'Tahap 2',
  [MunaqasyahBatch.TAHAP_3]: 'Tahap 3',
  [MunaqasyahBatch.TAHAP_4]: 'Tahap 4',
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function MunaqasyahResultTable({ data, title }: MunaqasyahResultTableProps) {
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
  } = useDataTableState<MunaqasyahResult, string>();

  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedJuz, setSelectedJuz] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const { data: academicSetting } = useSWR('/api/academicSetting', fetcher);

  const defaultPeriod = academicSetting
    ? `${academicSetting.currentYear}-${academicSetting.currentSemester}`
    : '';

  // Extract teacher name from the first available result
  const teacherName = useMemo(() => {
    if (data.length > 0 && data[0].teacher) {
      return data[0].teacher.user.fullName;
    }
    return '';
  }, [data]);

  const academicPeriods = useMemo(() => {
    const set = new Set<string>();
    for (const result of data) {
      set.add(`${result.academicYear}-${result.semester}`);
    }
    return Array.from(set);
  }, [data]);

  // Filter data by selected period first
  const filteredByPeriod = useMemo(() => {
    if (!selectedPeriod) return data;
    const [year, semester] = selectedPeriod.split('-');
    return data.filter((result) => result.academicYear === year && result.semester === semester);
  }, [data, selectedPeriod]);

  // Available groups based on period filter
  const availableGroups = useMemo(() => {
    const groupMap = new Map<string, { id: string; name: string; classroom: string }>();
    filteredByPeriod.forEach((result) => {
      const groupKey = `${result.groupName}-${result.classroomName}`;
      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, {
          id: groupKey,
          name: result.groupName,
          classroom: result.classroomName,
        });
      }
    });
    return Array.from(groupMap.values());
  }, [filteredByPeriod]);

  // Available students based on group filter
  const availableStudents = useMemo(() => {
    if (selectedGroupId === 'all') return [];
    const students = new Set<string>();
    filteredByPeriod.forEach((result) => {
      const groupKey = `${result.groupName}-${result.classroomName}`;
      if (groupKey === selectedGroupId) {
        students.add(result.student.user.fullName);
      }
    });
    return Array.from(students).sort();
  }, [filteredByPeriod, selectedGroupId]);

  // Available batches
  const availableBatches = useMemo(() => {
    const batches = new Set<MunaqasyahBatch>();
    filteredByPeriod.forEach((result) => {
      batches.add(result.batch);
    });
    return Array.from(batches);
  }, [filteredByPeriod]);

  // Available stages
  const availableStages = useMemo(() => {
    const stages = new Set<MunaqasyahStage>();
    filteredByPeriod.forEach((result) => {
      stages.add(result.stage);
    });
    return Array.from(stages);
  }, [filteredByPeriod]);

  // Available juz
  const availableJuz = useMemo(() => {
    const juzSet = new Set<string>();
    filteredByPeriod.forEach((result) => {
      juzSet.add(result.juz.name);
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
    setSelectedStatus('all');
    // Clear table filters
    table.getColumn('Kelompok')?.setFilterValue(undefined);
    table.getColumn('Siswa')?.setFilterValue(undefined);
    table.getColumn('Batch')?.setFilterValue(undefined);
    table.getColumn('Tahap')?.setFilterValue(undefined);
    table.getColumn('Juz')?.setFilterValue(undefined);
    table.getColumn('Status')?.setFilterValue(undefined);
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
      .getColumn('Tahap')
      ?.setFilterValue(value === 'all' ? undefined : stageLabels[value as MunaqasyahStage]);
  };

  const handleJuzChange = (value: string) => {
    setSelectedJuz(value);
    table.getColumn('Juz')?.setFilterValue(value === 'all' ? undefined : value);
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    if (value === 'all') {
      table.getColumn('Status')?.setFilterValue(undefined);
    } else {
      table.getColumn('Status')?.setFilterValue(value === 'lulus' ? 'Lulus' : 'Tidak Lulus');
    }
  };

  const columns = useMemo<ColumnDef<MunaqasyahResult>[]>(
    () => [
      {
        accessorKey: 'schedule.date',
        id: 'Tanggal',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
        cell: ({ row }) => {
          const s = row.original;
          const date = new Date(s.schedule.date).toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });
          return (
            <div className="text-sm min-w-[180px]">
              <div className="font-medium">{date}</div>
              <div className="text-muted-foreground">{s.schedule.sessionName}</div>
              <div className="text-muted-foreground text-xs">
                {s.schedule.startTime} - {s.schedule.endTime}
              </div>
              <div className="text-muted-foreground text-xs">📍 {s.schedule.location}</div>
            </div>
          );
        },
      },
      {
        id: 'Siswa',
        header: 'Siswa',
        accessorFn: (row) => row.student.user.fullName,
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">{row.original.student.user.fullName}</div>
            <div className="text-muted-foreground">{row.original.student.nis}</div>
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
        accessorFn: (row) => `${row.groupName}-${row.classroomName}`,
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">{row.original.groupName}</div>
            <div className="text-muted-foreground">{row.original.classroomName}</div>
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
        accessorFn: (row) => batchLabels[row.batch],
        cell: ({ row }) => <Badge variant="secondary">{batchLabels[row.original.batch]}</Badge>,
        filterFn: (row, columnId, filterValue) => {
          const value = row.getValue(columnId) as string;
          return value === filterValue;
        },
      },
      {
        id: 'Tahap',
        header: 'Tahap',
        accessorFn: (row) => stageLabels[row.stage],
        cell: ({ row }) => <Badge variant="default">{stageLabels[row.original.stage]}</Badge>,
        filterFn: (row, columnId, filterValue) => {
          const value = row.getValue(columnId) as string;
          return value === filterValue;
        },
      },
      {
        id: 'Juz',
        header: 'Juz',
        accessorFn: (row) => row.juz.name,
        cell: ({ row }) => <Badge variant="outline">{row.original.juz.name}</Badge>,
        filterFn: (row, columnId, filterValue) => {
          const value = row.getValue(columnId) as string;
          return value === filterValue;
        },
      },
      {
        id: 'Nilai',
        accessorKey: 'score',
        header: 'Nilai',
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">
              {row.original.score?.toFixed(1) || '0.0'} (
              {gradeLabels[row.original.grade] || row.original.grade})
            </div>
          </div>
        ),
      },
      {
        id: 'Status',
        header: 'Status',
        accessorFn: (row) => (row.passed ? 'Lulus' : 'Tidak Lulus'),
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
        filterFn: (row, columnId, filterValue) => {
          const value = row.getValue(columnId) as string;
          return value === filterValue;
        },
      },
      {
        id: 'Nilai Final',
        header: 'Nilai Final',
        cell: ({ row }) => {
          const finalResult = row.original.finalResult;
          if (!finalResult) {
            return <div className="text-xs text-muted-foreground">Belum ada hasil final</div>;
          }

          return (
            <div className="text-sm">
              <div className="font-bold text-base">{(finalResult.finalScore ?? 0).toFixed(1)}</div>
              <div className="font-medium text-primary text-xs">
                {gradeLabels[finalResult.finalGrade] || finalResult.finalGrade}
              </div>
              <Badge
                variant={finalResult.passed ? 'default' : 'destructive'}
                className="text-xs mt-1"
              >
                {finalResult.passed ? '✅ LULUS' : '❌ TIDAK LULUS'}
              </Badge>
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
                  {group.name} - {group.classroom}
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
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Pilih Tahapan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tahap</SelectItem>
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

        <div>
          <Label className="mb-2 block sr-only">Filter Status</Label>
          <Select value={selectedStatus} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Pilih Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="lulus">Lulus</SelectItem>
              <SelectItem value="tidak-lulus">Tidak Lulus</SelectItem>
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
            Tidak ada hasil Munaqasyah untuk periode {selectedPeriod.replace('-', ' ')}.
          </p>
        </div>
      )}
    </>
  );
}
