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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDataTableState } from '@/lib/hooks/use-data-table';
import { DataTable } from '@/components/ui/data-table';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import useSWR from 'swr';
import { Semester, MunaqasyahBatch, MunaqasyahStage } from '@prisma/client';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { ExportToPDFButton } from './ExportToPDFButton';
import { MunaqasyahResultAlertDialog } from './MunaqasyahResultAlertDialog';
import { MunaqasyahResultEditDialog } from './MunaqasyahResultEditDialog';
// import { Pencil, Trash2 } from 'lucide-react';
import { Pencil } from 'lucide-react';

export type MunaqasyahResult = {
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
    examiner?: { user?: { fullName: string } };
  };
  student: {
    nis: string;
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
};

interface MunaqasyahResultTableProps {
  data: MunaqasyahResult[];
  title: string;
  onRefresh?: () => void;
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

export function MunaqasyahResultTable({ data, title, onRefresh }: MunaqasyahResultTableProps) {
  // Dialog states
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    result: MunaqasyahResult | null;
  }>({
    open: false,
    result: null,
  });
  const [editDialog, setEditDialog] = useState<{ open: boolean; result: MunaqasyahResult | null }>({
    open: false,
    result: null,
  });
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
  } = useDataTableState<MunaqasyahResult, string>();

  // Filter state
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedJuz, setSelectedJuz] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Academic settings integration
  const { data: academicSetting } = useSWR('/api/academicSetting', (url: string) =>
    fetch(url).then((res) => res.json())
  );

  const defaultPeriod = academicSetting
    ? `${academicSetting.currentYear}-${academicSetting.currentSemester}`
    : '';

  // Academic periods from data
  const academicPeriods = useMemo(() => {
    const set = new Set<string>();
    for (const result of data) {
      set.add(`${result.academicYear}-${result.semester}`);
    }
    return Array.from(set);
  }, [data]);

  // Filter by academic period first
  const filteredByPeriod = useMemo(() => {
    if (!selectedPeriod) return data;
    const [year, semester] = selectedPeriod.split('-');
    return data.filter((result) => {
      return result.academicYear === year && result.semester === semester;
    });
  }, [data, selectedPeriod]);

  // Available groups from filtered data
  const availableGroups = useMemo(() => {
    const groupMap = new Map<string, { id: string; name: string; classroom: { name: string } }>();
    filteredByPeriod.forEach((result) => {
      const groupKey = `${result.groupName}-${result.classroomName}`;
      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, {
          id: groupKey,
          name: result.groupName,
          classroom: { name: result.classroomName },
        });
      }
    });
    return Array.from(groupMap.values());
  }, [filteredByPeriod]);

  // Available students from selected group
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

  // Available batches from data
  const availableBatches = useMemo(() => {
    const batches = new Set<MunaqasyahBatch>();
    filteredByPeriod.forEach((result) => {
      batches.add(result.batch);
    });
    return Array.from(batches);
  }, [filteredByPeriod]);

  // Available stages from data
  const availableStages = useMemo(() => {
    const stages = new Set<MunaqasyahStage>();
    filteredByPeriod.forEach((result) => {
      stages.add(result.stage);
    });
    return Array.from(stages);
  }, [filteredByPeriod]);

  // Available juz from data
  const availableJuz = useMemo(() => {
    const juz = new Set<string>();
    filteredByPeriod.forEach((result) => {
      juz.add(result.juz.name);
    });
    return Array.from(juz).sort();
  }, [filteredByPeriod]);

  // Available statuses
  const availableStatuses = useMemo(() => {
    const statuses = new Set<string>();
    filteredByPeriod.forEach((result) => {
      statuses.add(result.passed ? 'Lulus' : 'Tidak Lulus');
    });
    return Array.from(statuses);
  }, [filteredByPeriod]);

  // Set default period on mount
  useEffect(() => {
    if (defaultPeriod && !selectedPeriod && academicPeriods.length > 0) {
      const targetPeriod = academicPeriods.includes(defaultPeriod)
        ? defaultPeriod
        : academicPeriods[0];
      setSelectedPeriod(targetPeriod);
    }
  }, [defaultPeriod, academicPeriods, selectedPeriod]);

  // Academic year for export
  const academicYearForExport = useMemo(() => {
    if (!selectedPeriod) return '';
    const [year, semester] = selectedPeriod.split('-');
    return `${year} ${semester}`;
  }, [selectedPeriod]);

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
      const group = availableGroups.find((g) => g.id === value);
      if (group) {
        table.getColumn('Kelompok')?.setFilterValue(`${group.name} - ${group.classroom.name}`);
      }
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
    table.getColumn('Status')?.setFilterValue(value === 'all' ? undefined : value);
  };

  const columns = useMemo<ColumnDef<MunaqasyahResult>[]>(
    () => [
      {
        id: 'Tanggal',
        accessorKey: 'date',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
        cell: ({ row }) => {
          const s = row.original.schedule;
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
        accessorFn: (row) => row.student.user.fullName,
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">{row.original.student.user.fullName}</div>
            <div className="text-muted-foreground">{row.original.student.nis}</div>
          </div>
        ),
      },
      {
        id: 'Kelompok',
        header: 'Kelompok',
        accessorFn: (row) => `${row.groupName} - ${row.classroomName}`,
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">{row.original.groupName}</div>
            <div className="text-muted-foreground">{row.original.classroomName}</div>
          </div>
        ),
      },
      {
        id: 'Batch',
        header: 'Batch',
        accessorFn: (row) => batchLabels[row.batch],
        cell: ({ row }) => <div className='font-medium'>{batchLabels[row.original.batch]}</div>,
        filterFn: (row, columnId, filterValue) => {
          const value = row.getValue(columnId) as string;
          return value.includes(filterValue);
        },
      },
      {
        id: 'Tahapan Ujian',
        header: 'Tahapan Ujian',
        accessorFn: (row) => stageLabels[row.stage],
        cell: ({ row }) => <div className='font-medium'>{stageLabels[row.original.stage]}</div>,
        filterFn: (row, columnId, filterValue) => {
          const value = row.getValue(columnId) as string;
          return value.includes(filterValue);
        },
      },
      {
        id: 'Juz',
        header: 'Juz',
        accessorFn: (row) => row.juz.name,
        cell: ({ row }) => <div className='font-medium'>{row.original.juz.name}</div>,
        filterFn: (row, columnId, filterValue) => {
          const value = row.getValue(columnId) as string;
          return value === filterValue;
        },
      },
      {
        id: 'Penguji',
        header: 'Penguji',
        cell: ({ row }) => (
          <div className="text-sm">
            {row.original.schedule.examiner ? (
              <div>
                <div className="font-medium">{row.original.schedule.examiner.user?.fullName}</div>
              </div>
            ) : (
              <span className="text-medium">Koordinator Al-Qur&apos;an</span>
            )}
          </div>
        ),
      },
      {
        id: 'Nilai',
        header: 'Nilai',
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">
              {(row.original.score ?? 0).toFixed(1)} (
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
      {
        id: 'actions',
        header: 'Aksi',
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
          const result = row.original;

          return (
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                setEditDialog({
                  open: true,
                  result,
                })
              }
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            //   <div className="flex gap-2">
            //   <Button
            //     variant="secondary"
            //     size="sm"
            //     onClick={() =>
            //       setEditDialog({
            //         open: true,
            //         result,
            //       })
            //     }
            //   >
            //     <Pencil className="h-4 w-4" />
            //     Edit
            //   </Button>
            //   <Button
            //     variant="destructive"
            //     size="sm"
            //     onClick={() =>
            //       setDeleteDialog({
            //         open: true,
            //         result,
            //       })
            //     }
            //   >
            //     <Trash2 className="h-4 w-4" />
            //     Hapus
            //   </Button>
            // </div>
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

  // Dialog handlers
  const handleRefresh = () => {
    onRefresh?.();
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialog({ open: false, result: null });
  };

  const handleCloseEditDialog = () => {
    setEditDialog({ open: false, result: null });
  };

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
            <SelectTrigger className="min-w-[200px]">
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
          <Select
            disabled={selectedGroupId === 'all'}
            value={selectedStudent}
            onValueChange={handleStudentChange}
          >
            <SelectTrigger className="min-w-[200px]">
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
            <SelectTrigger className="min-w-[200px]">
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
          <Label className="mb-2 block sr-only">Filter Tahap</Label>
          <Select value={selectedStage} onValueChange={handleStageChange}>
            <SelectTrigger className="min-w-[200px]">
              <SelectValue placeholder="Pilih Tahap" />
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
            <SelectTrigger className="min-w-[200px]">
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
            <SelectTrigger className="min-w-[200px]">
              <SelectValue placeholder="Pilih Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {availableStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ExportToPDFButton table={table} academicYear={academicYearForExport} />
      </div>

      <DataTable title={title} table={table} showColumnFilter={false} />

      {selectedPeriod && filteredByPeriod.length === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center mt-4">
          <p className="text-muted-foreground">
            Tidak ada hasil munaqasyah untuk Tahun Akademik {selectedPeriod.replace('-', ' ')}.
          </p>
        </div>
      )}

      {/* Delete Dialog */}
      {deleteDialog.result && (
        <MunaqasyahResultAlertDialog
          result={deleteDialog.result}
          open={deleteDialog.open}
          onOpenChange={handleCloseDeleteDialog}
          onConfirm={handleRefresh}
        />
      )}

      {/* Edit Dialog */}
      {editDialog.result && (
        <MunaqasyahResultEditDialog
          result={editDialog.result}
          open={editDialog.open}
          onOpenChange={handleCloseEditDialog}
          onSave={handleRefresh}
        />
      )}
    </>
  );
}
