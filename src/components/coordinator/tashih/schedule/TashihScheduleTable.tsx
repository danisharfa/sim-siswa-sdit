'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';
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
import { useDataTableState } from '@/lib/hooks/use-data-table';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { DataTable } from '@/components/ui/data-table';
import { Semester, TashihType } from '@prisma/client';
import { ExportToPDFButton } from './ExportToPDFButton';
import { TashihScheduleAlertDialog } from './TashihScheduleAlertDialog';
import { TashihScheduleEditDialog } from './TashihScheduleEditDialog';

export type TashihSchedule = {
  id: string;
  date: string;
  sessionName: string;
  startTime: string;
  endTime: string;
  location: string;
  hasResults?: boolean;
  schedules: {
    tashihRequest: {
      tashihType?: TashihType;
      surah?: { name: string };
      juz?: { name: string };
      wafa?: { name: string };
      startPage?: number;
      endPage?: number;
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

interface Props {
  data: TashihSchedule[];
  title: string;
  onRefresh: () => void;
}

export function TashihScheduleTable({ data, title, onRefresh }: Props) {
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
  } = useDataTableState<TashihSchedule, 'edit' | 'delete'>();

  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState('all');

  const { data: academicSetting } = useSWR('/api/academicSetting', (url: string) =>
    fetch(url).then((res) => res.json())
  );

  const defaultPeriod = academicSetting
    ? `${academicSetting.currentYear}-${academicSetting.currentSemester}`
    : '';

  const academicPeriods = useMemo(() => {
    const set = new Set<string>();
    for (const schedule of data) {
      for (const s of schedule.schedules) {
        const r = s.tashihRequest;
        set.add(`${r.group.classroom.academicYear}-${r.group.classroom.semester}`);
      }
    }
    return Array.from(set);
  }, [data]);

  const filteredByPeriod = useMemo(() => {
    if (!selectedPeriod) return data;
    const [year, semester] = selectedPeriod.split('-');
    return data.filter((schedule) =>
      schedule.schedules.some((s) => {
        const r = s.tashihRequest;
        return r.group.classroom.academicYear === year && r.group.classroom.semester === semester;
      })
    );
  }, [data, selectedPeriod]);

  const availableGroups = useMemo(() => {
    const groupMap = new Map<string, { id: string; name: string; classroom: { name: string } }>();
    filteredByPeriod.forEach((schedule) => {
      schedule.schedules.forEach((s) => {
        const r = s.tashihRequest;
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

  const availableStudents = useMemo(() => {
    if (selectedGroupId === 'all') return [];
    const students = new Set<string>();
    filteredByPeriod.forEach((schedule) => {
      schedule.schedules.forEach((s) => {
        const r = s.tashihRequest;
        const groupKey = `${r.group.name}-${r.group.classroom.name}`;
        if (groupKey === selectedGroupId) {
          students.add(r.student.user.fullName);
        }
      });
    });
    return Array.from(students).sort();
  }, [filteredByPeriod, selectedGroupId]);

  useEffect(() => {
    if (defaultPeriod && !selectedPeriod && academicPeriods.length > 0) {
      const targetPeriod = academicPeriods.includes(defaultPeriod)
        ? defaultPeriod
        : academicPeriods[0];
      setSelectedPeriod(targetPeriod);
    }
  }, [defaultPeriod, academicPeriods, selectedPeriod]);

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
    // Clear table filters
    table.getColumn('Kelompok')?.setFilterValue(undefined);
    table.getColumn('Siswa')?.setFilterValue(undefined);
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

  const handleOpenEditDialog = useCallback(
    (schedule: TashihSchedule) => {
      setSelectedSchedule(schedule);
      setDialogType('edit');
    },
    [setDialogType, setSelectedSchedule]
  );

  const handleOpenDeleteDialog = useCallback(
    (schedule: TashihSchedule) => {
      setSelectedSchedule(schedule);
      setDialogType('delete');
    },
    [setDialogType, setSelectedSchedule]
  );

  const columns = useMemo<ColumnDef<TashihSchedule>[]>(
    () => [
      {
        accessorKey: 'tashihSchedule.date',
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
        accessorFn: (row) => row.schedules[0]?.tashihRequest.student.user.fullName,
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">
              {row.original.schedules[0]?.tashihRequest.student.user.fullName}
            </div>
            <div className="text-muted-foreground">
              {row.original.schedules[0]?.tashihRequest.student.nis}
            </div>
          </div>
        ),
      },
      {
        id: 'Kelompok',
        header: 'Kelompok',
        accessorFn: (row) =>
          `${row.schedules[0]?.tashihRequest.group.name} - ${row.schedules[0]?.tashihRequest.group.classroom.name}`,
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">{row.original.schedules[0]?.tashihRequest.group.name}</div>
            <div className="text-muted-foreground">
              {row.original.schedules[0]?.tashihRequest.group.classroom.name}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'schedules.tashihRequest.teacher.user.fullName',
        id: 'Guru Pembimbing',
        header: 'Guru Pembimbing',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.schedules.map((s, i) => (
              <Badge key={i} variant="secondary" className="w-fit">
                {s.tashihRequest.teacher.user.fullName}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        accessorKey: 'schedules.tashihRequest.tashihType',
        id: 'Materi',
        header: 'Materi',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.schedules.map((s, i) => {
              const r = s.tashihRequest;
              return (
                <Badge key={i} variant="outline" className="w-fit text-muted-foreground">
                  {r.tashihType === TashihType.ALQURAN
                    ? `${r.surah?.name ?? '-'} (${r.juz?.name ?? '-'})`
                    : `${r.wafa?.name ?? '-'} (Hal ${r.startPage ?? '-'}${
                        r.startPage !== r.endPage ? `–${r.endPage}` : ''
                      })`}
                </Badge>
              );
            })}
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

        <ExportToPDFButton table={table} academicYear={academicYearForExport} />
      </div>

      <DataTable title={title} table={table} showColumnFilter={false} />

      {selectedPeriod && filteredByPeriod.length === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center mt-4">
          <p className="text-muted-foreground">
            Tidak ada jadwal tashih untuk Tahun Akademik {selectedPeriod.replace('-', ' ')}.
          </p>
        </div>
      )}

      {dialogType === 'edit' && selectedSchedule && (
        <TashihScheduleEditDialog
          schedule={selectedSchedule}
          open={true}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setDialogType(null);
              setSelectedSchedule(null);
            }
          }}
          onSave={() => {
            onRefresh();
            setDialogType(null);
            setSelectedSchedule(null);
          }}
        />
      )}

      {dialogType === 'delete' && selectedSchedule && (
        <TashihScheduleAlertDialog
          schedule={selectedSchedule}
          open={true}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setDialogType(null);
              setSelectedSchedule(null);
            }
          }}
          onConfirm={() => {
            onRefresh();
            setDialogType(null);
            setSelectedSchedule(null);
          }}
        />
      )}
    </>
  );
}
