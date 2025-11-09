'use client';

import { useMemo, useState, useEffect } from 'react';
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
import { useDataTableState } from '@/lib/hooks/use-data-table';
import { DataTable } from '@/components/ui/data-table';
import { Semester, TashihType } from '@prisma/client';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { ExportToPDFButton } from './ExportToPDFButton';

export interface TashihResult {
  id: string;
  passed: boolean;
  notes: string | null;
  tashihRequest: {
    tashihType: TashihType;
    surah: { name: string } | null;
    juz: { name: string } | null;
    wafa: { name: string } | null;
    startPage: number | null;
    endPage: number | null;
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
  tashihSchedule: {
    date: string;
    sessionName: string;
    startTime: string;
    endTime: string;
    location: string;
  };
}

interface Props {
  data: TashihResult[];
  title: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function TashihResultTable({ data, title }: Props) {
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
  } = useDataTableState<TashihResult, string>();

  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [selectedTashihType, setSelectedTashihType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const { data: academicSetting } = useSWR('/api/academicSetting', fetcher);

  const defaultPeriod = academicSetting
    ? `${academicSetting.currentYear}-${academicSetting.currentSemester}`
    : '';

  // Extract teacher name from the first available result
  const teacherName = useMemo(() => {
    if (data.length > 0 && data[0].tashihRequest.teacher) {
      return data[0].tashihRequest.teacher.user.fullName;
    }
    return '';
  }, [data]);

  const academicPeriods = useMemo(() => {
    const set = new Set<string>();
    for (const result of data) {
      const r = result.tashihRequest;
      set.add(`${r.group.classroom.academicYear}-${r.group.classroom.semester}`);
    }
    return Array.from(set);
  }, [data]);

  const filteredByPeriod = useMemo(() => {
    if (!selectedPeriod) return data;
    const [year, semester] = selectedPeriod.split('-');
    return data.filter(
      (result) =>
        result.tashihRequest.group.classroom.academicYear === year &&
        result.tashihRequest.group.classroom.semester === semester
    );
  }, [data, selectedPeriod]);

  const availableGroups = useMemo(() => {
    const groupMap = new Map<string, { id: string; name: string; classroom: { name: string } }>();
    filteredByPeriod.forEach((result) => {
      const r = result.tashihRequest;
      const groupKey = `${r.group.name}-${r.group.classroom.name}`;
      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, {
          id: groupKey,
          name: r.group.name,
          classroom: { name: r.group.classroom.name },
        });
      }
    });
    return Array.from(groupMap.values());
  }, [filteredByPeriod]);

  const availableStudents = useMemo(() => {
    if (selectedGroupId === 'all') return [];
    const students = new Set<string>();
    filteredByPeriod.forEach((result) => {
      const r = result.tashihRequest;
      const groupKey = `${r.group.name}-${r.group.classroom.name}`;
      if (groupKey === selectedGroupId) {
        students.add(r.student.user.fullName);
      }
    });
    return Array.from(students).sort();
  }, [filteredByPeriod, selectedGroupId]);

  const availableTashihTypes = useMemo(() => {
    const types = new Set<TashihType>();
    filteredByPeriod.forEach((result) => {
      types.add(result.tashihRequest.tashihType);
    });
    return Array.from(types);
  }, [filteredByPeriod]);

  const availableStatuses = useMemo(() => {
    const statuses = new Set<string>();
    filteredByPeriod.forEach((result) => {
      statuses.add(result.passed ? 'lulus' : 'tidak-lulus');
    });
    return Array.from(statuses);
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
    setSelectedTashihType('all');
    setSelectedStatus('all');
    // Clear table filters
    table.getColumn('Kelompok')?.setFilterValue(undefined);
    table.getColumn('Siswa')?.setFilterValue(undefined);
    table.getColumn('Jenis Tashih')?.setFilterValue(undefined);
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

  const handleTashihTypeChange = (value: string) => {
    setSelectedTashihType(value);
    table.getColumn('Jenis Tashih')?.setFilterValue(value === 'all' ? undefined : value);
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    table.getColumn('Status')?.setFilterValue(value === 'all' ? undefined : value);
  };

  const columns = useMemo<ColumnDef<TashihResult>[]>(
    () => [
      {
        accessorKey: 'tashihSchedule.date',
        id: 'Tanggal',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
        cell: ({ row }) => {
          const s = row.original.tashihSchedule;
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
        accessorFn: (row) => row.tashihRequest.student.user.fullName,
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">{row.original.tashihRequest.student.user.fullName}</div>
            <div className="text-muted-foreground">{row.original.tashihRequest.student.nis}</div>
          </div>
        ),
      },
      {
        id: 'Kelompok',
        header: 'Kelompok',
        accessorFn: (row) =>
          `${row.tashihRequest.group.name} - ${row.tashihRequest.group.classroom.name}`,
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">{row.original.tashihRequest.group.name}</div>
            <div className="text-muted-foreground">
              {row.original.tashihRequest.group.classroom.name}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'tashihRequest.tashihType',
        id: 'Jenis Tashih',
        header: 'Jenis Tashih',
        filterFn: (row) => {
          if (selectedTashihType === 'all') return true;
          return row.original.tashihRequest.tashihType === selectedTashihType;
        },
        cell: ({ row }) => (
          <div className="font-medium">
            {row.original.tashihRequest.tashihType.replaceAll('_', ' ')}
          </div>
        ),
      },
      {
        accessorKey: 'tashihRequest',
        id: 'Materi',
        header: 'Materi',
        cell: ({ row }) => {
          const r = row.original.tashihRequest;
          const materi =
            r.tashihType === TashihType.ALQURAN
              ? `${r.surah?.name ?? '-'} (${r.juz?.name ?? '-'})`
              : `${r.wafa?.name ?? '-'} (Hal ${r.startPage ?? '-'}${
                  r.endPage ? `–${r.endPage}` : ''
                })`;
          return <span>{materi}</span>;
        },
      },
      {
        id: 'Status',
        accessorKey: 'passed',
        header: 'Status',
        filterFn: (row) => {
          if (selectedStatus === 'all') return true;
          const passed = row.original.passed;
          return selectedStatus === 'lulus' ? passed : !passed;
        },
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
      },
      {
        id: 'Catatan',
        accessorKey: 'notes',
        header: 'Catatan',
        cell: ({ row }) => row.original.notes || '-',
      },
    ],
    [selectedTashihType, selectedStatus]
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
          <Label className="mb-2 block sr-only">Filter Jenis Tashih</Label>
          <Select value={selectedTashihType} onValueChange={handleTashihTypeChange}>
            <SelectTrigger className="min-w-[180px]">
              <SelectValue placeholder="Pilih Jenis Tashih" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Jenis Tashih</SelectItem>
              {availableTashihTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.replaceAll('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block sr-only">Filter Status</Label>
          <Select value={selectedStatus} onValueChange={handleStatusChange}>
            <SelectTrigger className="min-w-[150px]">
              <SelectValue placeholder="Pilih Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {availableStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status === 'lulus' ? 'Lulus' : 'Tidak Lulus'}
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
            Tidak ada hasil tashih untuk Tahun Akademik {selectedPeriod.replace('-', ' ')}.
          </p>
        </div>
      )}
    </>
  );
}
