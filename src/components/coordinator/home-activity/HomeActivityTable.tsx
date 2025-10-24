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
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDataTableState } from '@/lib/hooks/use-data-table';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { DataTable } from '@/components/ui/data-table';
import { HomeActivityType, Semester } from '@prisma/client';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { type DateRange } from 'react-day-picker';
import { Calendar23 } from '@/components/layout/calendar/calendar-23';
import { ExportToPDFButton } from '@/components/coordinator/home-activity/ExportToPDFButton';

export type HomeActivity = {
  id: string;
  date: string;
  activityType: HomeActivityType;
  startVerse: number;
  endVerse: number;
  note: string | null;
  student: {
    nis: string;
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
  surah: { name: string };
  juz: { name: string };
};

interface Props {
  data: HomeActivity[];
  title: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function HomeActivityTable({ data, title }: Props) {
  // ===== STATE MANAGEMENT =====
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
  } = useDataTableState<HomeActivity, string>();

  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedActivityType, setSelectedActivityType] = useState('all');
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // ===== DATA FETCHING =====
  const { data: academicSetting } = useSWR('/api/academicSetting', fetcher);

  // ===== COMPUTED VALUES =====
  const defaultPeriod = academicSetting
    ? `${academicSetting.currentYear}-${academicSetting.currentSemester}`
    : '';

  const academicPeriods = useMemo(
    () =>
      Array.from(
        new Set(data.map((d) => `${d.group.classroom.academicYear}-${d.group.classroom.semester}`))
      ),
    [data]
  );

  const filteredByPeriod = useMemo(() => {
    if (!selectedPeriod) return data;
    const [year, semester] = selectedPeriod.split('-');
    return data.filter(
      (item) =>
        item.group.classroom.academicYear === year && item.group.classroom.semester === semester
    );
  }, [data, selectedPeriod]);

  const availableGroups = useMemo(() => {
    const groupMap = new Map<string, { id: string; name: string; classroom: { name: string } }>();
    filteredByPeriod.forEach((item) => {
      const groupKey = `${item.group.name}-${item.group.classroom.name}`;
      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, {
          id: groupKey,
          name: item.group.name,
          classroom: { name: item.group.classroom.name },
        });
      }
    });
    return Array.from(groupMap.values());
  }, [filteredByPeriod]);

  const availableStudents = useMemo(() => {
    if (selectedGroupId === 'all') return [];
    return Array.from(
      new Set(
        filteredByPeriod
          .filter((item) => `${item.group.name}-${item.group.classroom.name}` === selectedGroupId)
          .map((item) => item.student.user.fullName)
      )
    ).sort();
  }, [filteredByPeriod, selectedGroupId]);

  const availableActivityTypes = useMemo(
    () => Array.from(new Set(filteredByPeriod.map((item) => item.activityType))),
    [filteredByPeriod]
  );

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

  const handleActivityTypeChange = (value: string) => {
    setSelectedActivityType(value);
    table.getColumn('Jenis Aktivitas')?.setFilterValue(value === 'all' ? undefined : value);
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    table.getColumn('Tanggal')?.setFilterValue('custom');
  };

  const columns = useMemo<ColumnDef<HomeActivity>[]>(
    () => [
      {
        accessorKey: 'date',
        id: 'Tanggal',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
        filterFn: (row, columnId) => {
          if (!dateRange?.from && !dateRange?.to) return true;
          const date = new Date(row.getValue(columnId));
          const isAfterStart = !dateRange.from || date >= dateRange.from;
          const isBeforeEnd = !dateRange.to || date <= dateRange.to;
          return isAfterStart && isBeforeEnd;
        },
        cell: ({ row }) => (
          <span>
            {new Date(row.original.date).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        ),
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
        accessorFn: (row) => `${row.group.name} - ${row.group.classroom.name}`,
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">{row.original.group.name}</div>
            <div className="text-muted-foreground">{row.original.group.classroom.name}</div>
          </div>
        ),
      },
      {
        id: 'Jenis Aktivitas',
        header: 'Jenis Aktivitas',
        accessorFn: (row) => row.activityType,
        cell: ({ row }) => (
          <Badge variant="secondary" className="w-fit">
            {row.original.activityType}
          </Badge>
        ),
      },
      {
        id: 'Surah',
        header: 'Surah',
        accessorFn: (row) => `${row.surah.name} (${row.startVerse} - ${row.endVerse})`,
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">{`${row.original.surah.name} (Ayat ${row.original.startVerse} - ${row.original.endVerse})`}</div>
            <div className="text-muted-foreground">{row.original.juz.name}</div>
          </div>
        ),
      },
      {
        id: 'Catatan',
        header: 'Catatan',
        accessorKey: 'note',
        cell: ({ row }) => {
          const note = row.original.note;
          return (
            <span className="text-muted-foreground max-w-xs truncate">{note ? note : '-'}</span>
          );
        },
      },
    ],
    [dateRange]
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
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <>
      <div className="flex flex-wrap gap-4 items-end">
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

        <Label className="mb-2 block sr-only">Filter Kelompok</Label>
        <Select value={selectedGroupId} onValueChange={handleGroupChange}>
          <SelectTrigger className="min-w-[200px]">
            <SelectValue placeholder="Pilih Kelompok" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kelompok</SelectItem>
            {availableGroups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {`${group.name} - ${group.classroom.name}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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

        <Select value={selectedActivityType} onValueChange={handleActivityTypeChange}>
        <Label className="mb-2 block sr-only">Filter Jenis Aktivitas</Label>
          <SelectTrigger className="min-w-[200px]">
            <SelectValue placeholder="Pilih Jenis Aktivitas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Jenis Aktivitas</SelectItem>
            {availableActivityTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Calendar23 value={dateRange} onChange={handleDateRangeChange} />

        <ExportToPDFButton table={table} />
      </div>

      <DataTable title={title} table={table} showColumnFilter={false} />
    </>
  );
}
