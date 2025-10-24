'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
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
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import useSWR from 'swr';
import { useDataTableState } from '@/lib/hooks/use-data-table';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { DataTable } from '@/components/ui/data-table';
import { MunaqasyahBatch, MunaqasyahStage, Semester } from '@prisma/client';
import { ExportToPDFButton } from './ExportToPDFButton';
import { MunaqasyahScheduleAlertDialog } from './MunaqasyahScheduleAlertDialog';
import { MunaqasyahScheduleEditDialog } from './MunaqasyahScheduleEditDialog';

// Batch and Stage label mappings
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

export type MunaqasyahSchedule = {
  id: string;
  date: string;
  sessionName: string;
  startTime: string;
  endTime: string;
  location: string;
  examiner?: { userId: string; user?: { fullName: string } };
  hasResults?: boolean;
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
};

interface Props {
  data: MunaqasyahSchedule[];
  title: string;
  onRefresh: () => void;
}

export function MunaqasyahScheduleTable({ data, title, onRefresh }: Props) {
  const {
    sorting,
    setSorting,
    columnVisibility,
    setColumnVisibility,
    columnFilters,
    setColumnFilters,
    selectedItem: selectedSchedule,
    setSelectedItem: setSelectedSchedule,
    dialogType,
    setDialogType,
  } = useDataTableState<MunaqasyahSchedule, 'edit' | 'delete'>();

  // Filter state
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedJuz, setSelectedJuz] = useState('all');

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
    for (const schedule of data) {
      for (const s of schedule.scheduleRequests) {
        const r = s.request;
        set.add(`${r.group.classroom.academicYear}-${r.group.classroom.semester}`);
      }
    }
    return Array.from(set);
  }, [data]);

  // Filter by academic period first
  const filteredByPeriod = useMemo(() => {
    if (!selectedPeriod) return data;
    const [year, semester] = selectedPeriod.split('-');
    return data.filter((schedule) =>
      schedule.scheduleRequests.some((s) => {
        const r = s.request;
        return r.group.classroom.academicYear === year && r.group.classroom.semester === semester;
      })
    );
  }, [data, selectedPeriod]);

  // Available groups from filtered data
  const availableGroups = useMemo(() => {
    const groupMap = new Map<string, { id: string; name: string; classroom: { name: string } }>();
    filteredByPeriod.forEach((schedule) => {
      schedule.scheduleRequests.forEach((s) => {
        const r = s.request;
        const groupKey = `${r.group.name}-${r.group.classroom.name}`;
        if (!groupMap.has(groupKey)) {
          groupMap.set(groupKey, {
            id: groupKey,
            name: r.group.name,
            classroom: { name: r.group.classroom.name },
          });
        }
      });
    });
    return Array.from(groupMap.values());
  }, [filteredByPeriod]);

  // Available students from selected group
  const availableStudents = useMemo(() => {
    if (selectedGroupId === 'all') return [];
    const students = new Set<string>();
    filteredByPeriod.forEach((schedule) => {
      schedule.scheduleRequests.forEach((s) => {
        const r = s.request;
        const groupKey = `${r.group.name}-${r.group.classroom.name}`;
        if (groupKey === selectedGroupId) {
          students.add(r.student.user.fullName);
        }
      });
    });
    return Array.from(students).sort();
  }, [filteredByPeriod, selectedGroupId]);

  // Available batches from data
  const availableBatches = useMemo(() => {
    const batches = new Set<MunaqasyahBatch>();
    filteredByPeriod.forEach((schedule) => {
      schedule.scheduleRequests.forEach((s) => {
        batches.add(s.request.batch);
      });
    });
    return Array.from(batches);
  }, [filteredByPeriod]);

  // Available stages from data
  const availableStages = useMemo(() => {
    const stages = new Set<MunaqasyahStage>();
    filteredByPeriod.forEach((schedule) => {
      schedule.scheduleRequests.forEach((s) => {
        stages.add(s.request.stage);
      });
    });
    return Array.from(stages);
  }, [filteredByPeriod]);

  // Available juz from data
  const availableJuz = useMemo(() => {
    const juz = new Set<string>();
    filteredByPeriod.forEach((schedule) => {
      schedule.scheduleRequests.forEach((s) => {
        juz.add(s.request.juz.name);
      });
    });
    return Array.from(juz).sort();
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
  const handleOpenEditDialog = useCallback(
    (schedule: MunaqasyahSchedule) => {
      setSelectedSchedule(schedule);
      setDialogType('edit');
    },
    [setDialogType, setSelectedSchedule]
  );

  const handleOpenDeleteDialog = useCallback(
    (schedule: MunaqasyahSchedule) => {
      setSelectedSchedule(schedule);
      setDialogType('delete');
    },
    [setDialogType, setSelectedSchedule]
  );

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
    table.getColumn('Tahap')?.setFilterValue(undefined);
    table.getColumn('Juz')?.setFilterValue(undefined);
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
        id: 'Siswa',
        header: 'Siswa',
        accessorFn: (row) => row.scheduleRequests[0]?.request.student.user.fullName,
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">
              {row.original.scheduleRequests[0]?.request.student.user.fullName}
            </div>
            <div className="text-muted-foreground">
              {row.original.scheduleRequests[0]?.request.student.nis}
            </div>
          </div>
        ),
      },
      {
        id: 'Kelompok',
        header: 'Kelompok',
        accessorFn: (row) =>
          `${row.scheduleRequests[0]?.request.group.name} - ${row.scheduleRequests[0]?.request.group.classroom.name}`,
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">
              {row.original.scheduleRequests[0]?.request.group.name}
            </div>
            <div className="text-muted-foreground">
              {row.original.scheduleRequests[0]?.request.group.classroom.name}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'scheduleRequests.request.teacher.user.fullName',
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
        id: 'Batch',
        header: 'Batch',
        accessorFn: (row) => batchLabels[row.scheduleRequests[0]?.request.batch],
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.scheduleRequests.map((s, i) => (
              <Badge key={i} variant="outline" className="w-fit text-muted-foreground">
                {batchLabels[s.request.batch]}
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
        id: 'Tahap',
        header: 'Tahap',
        accessorFn: (row) => stageLabels[row.scheduleRequests[0]?.request.stage],
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.scheduleRequests.map((s, i) => (
              <Badge key={i} variant="default" className="w-fit">
                {stageLabels[s.request.stage]}
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
        id: 'Juz',
        header: 'Juz',
        accessorFn: (row) => row.scheduleRequests[0]?.request.juz.name,
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.scheduleRequests.map((s, i) => (
              <Badge key={i} variant="outline" className="w-fit text-muted-foreground">
                {s.request.juz?.name ?? '-'}
              </Badge>
            ))}
          </div>
        ),
        filterFn: (row, columnId, filterValue) => {
          const value = row.getValue(columnId) as string;
          return value === filterValue;
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
                <div className="font-medium">{row.original.examiner.user?.fullName}</div>
              </div>
            ) : (
              <span className="text-medium">Koordinator Al-Qur&apos;an</span>
            )}
          </div>
        ),
      },
      {
        id: 'actions',
        enableHiding: false,
        header: 'Aksi',
        cell: ({ row }) => {
          const schedule = row.original;
          const isAssessed = schedule.hasResults;

          if (isAssessed) {
            return <div className="text-sm text-muted-foreground">Sudah dinilai</div>;
          }

          return (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => handleOpenEditDialog(schedule)}>
                <Pencil className="h-4 w-4" />
                Edit
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleOpenDeleteDialog(schedule)}
              >
                <Trash2 className="h-4 w-4" />
                Hapus
              </Button>
            </div>
          );
        },
      },
    ],
    [handleOpenEditDialog, handleOpenDeleteDialog]
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
          <Label className="mb-2 block sr-only">Filter Tahapan</Label>
          <Select value={selectedStage} onValueChange={handleStageChange}>
            <SelectTrigger className="min-w-[200px]">
              <SelectValue placeholder="Pilih Tahapan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tahapan</SelectItem>
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

        <ExportToPDFButton table={table} academicYear={academicYearForExport} />
      </div>

      <DataTable title={title} table={table} showColumnFilter={false} />

      {selectedPeriod && filteredByPeriod.length === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center mt-4">
          <p className="text-muted-foreground">
            Tidak ada jadwal munaqasyah untuk Tahun Akademik {selectedPeriod.replace('-', ' ')}.
          </p>
        </div>
      )}

      {dialogType === 'edit' && selectedSchedule && (
        <MunaqasyahScheduleEditDialog
          schedule={selectedSchedule}
          open={true}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setDialogType(null);
              setSelectedSchedule(null);
            }
          }}
          onSave={() => {
            setDialogType(null);
            setSelectedSchedule(null);
            onRefresh();
          }}
        />
      )}

      {dialogType === 'delete' && selectedSchedule && (
        <MunaqasyahScheduleAlertDialog
          schedule={selectedSchedule}
          open={true}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setDialogType(null);
              setSelectedSchedule(null);
            }
          }}
          onConfirm={() => {
            setDialogType(null);
            setSelectedSchedule(null);
            onRefresh();
          }}
        />
      )}
    </>
  );
}
