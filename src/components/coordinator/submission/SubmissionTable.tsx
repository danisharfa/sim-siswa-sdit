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
import {
  CheckCircle2Icon,
  MinusCircle,
  RefreshCcw,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from 'lucide-react';
import { useDataTableState } from '@/lib/hooks/use-data-table';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { DataTable } from '@/components/ui/data-table';
import { Semester, SubmissionType, SubmissionStatus, Adab } from '@prisma/client';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { type DateRange } from 'react-day-picker';
import { Calendar23 } from '@/components/layout/calendar/calendar-23';
import { ExportToPDFButton } from '@/components/coordinator/submission/ExportToPDFButton';

export type Submission = {
  id: string;
  date: string;
  submissionType: SubmissionType;
  startVerse: number | null;
  endVerse: number | null;
  startPage: number | null;
  endPage: number | null;
  submissionStatus: SubmissionStatus;
  adab: Adab;
  note: string | null;
  student: {
    nis: string;
    user: { fullName: string };
  };
  group: {
    id: string;
    name: string;
    classroom: {
      name: string;
      academicYear: string;
      semester: Semester;
    };
  };
  juz: { id: number; name: string } | null;
  surah: { id: number; name: string } | null;
  wafa: { id: number; name: string } | null;
};

interface Props {
  data: Submission[];
  title: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function SubmissionTable({ data, title }: Props) {
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
  } = useDataTableState<Submission, string>();

  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedSubmissionType, setSelectedSubmissionType] = useState('all');
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedAdab, setSelectedAdab] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const { data: academicSetting } = useSWR('/api/academicSetting', fetcher);

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
    const groupMap = new Map<string, Submission['group']>();
    filteredByPeriod.forEach((item) => {
      if (!groupMap.has(item.group.id)) {
        groupMap.set(item.group.id, item.group);
      }
    });
    return Array.from(groupMap.values());
  }, [filteredByPeriod]);

  const availableStudents = useMemo(() => {
    if (selectedGroupId === 'all') return [];
    return Array.from(
      new Set(
        filteredByPeriod
          .filter((item) => item.group.id === selectedGroupId)
          .map((item) => item.student.user.fullName)
      )
    );
  }, [filteredByPeriod, selectedGroupId]);

  const availableSubmissionTypes = useMemo(
    () => Array.from(new Set(filteredByPeriod.map((item) => item.submissionType))),
    [filteredByPeriod]
  );

  const availableStatuses = useMemo(
    () => Array.from(new Set(filteredByPeriod.map((item) => item.submissionStatus))),
    [filteredByPeriod]
  );

  const availableAdabs = useMemo(
    () => Array.from(new Set(filteredByPeriod.map((item) => item.adab))),
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
    setSelectedSubmissionType('all');
    setSelectedStatus('all');
    setSelectedAdab('all');
    // Clear table filters
    table.getColumn('Kelompok')?.setFilterValue(undefined);
    table.getColumn('Siswa')?.setFilterValue(undefined);
    table.getColumn('Jenis Setoran')?.setFilterValue(undefined);
    table.getColumn('Status')?.setFilterValue(undefined);
    table.getColumn('Adab')?.setFilterValue(undefined);
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

  const handleSubmissionTypeChange = (value: string) => {
    setSelectedSubmissionType(value);
    table.getColumn('Jenis Setoran')?.setFilterValue(value === 'all' ? undefined : value);
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    table.getColumn('Status')?.setFilterValue(value === 'all' ? undefined : value);
  };

  const handleAdabChange = (value: string) => {
    setSelectedAdab(value);
    table.getColumn('Adab')?.setFilterValue(value === 'all' ? undefined : value);
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    table.getColumn('Tanggal')?.setFilterValue('custom');
  };

  const columns = useMemo<ColumnDef<Submission>[]>(
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
            {new Date(row.getValue('Tanggal')).toLocaleDateString('id-ID', {
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
      },
      {
        accessorKey: 'submissionType',
        id: 'Jenis Setoran',
        header: 'Jenis Setoran',
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.submissionType.replaceAll('_', ' ')}</Badge>
        ),
      },
      {
        id: 'Surah',
        header: 'Surah',
        accessorFn: (row) => row.surah?.name ?? '-',
        cell: ({ row }) => {
          const { surah, startVerse, endVerse, juz } = row.original;
          return (
            <div className="text-sm">
              {surah ? (
                <>
                  <div className="font-medium">
                    {`${surah.name} (Ayat ${startVerse} - ${endVerse})`}
                  </div>
                  <div className="text-muted-foreground">{juz?.name}</div>
                </>
              ) : (
                <span>-</span>
              )}
            </div>
          );
        },
      },
      {
        id: 'Wafa',
        header: 'Wafa',
        accessorFn: (row) => row.wafa?.name ?? '-',
        cell: ({ row }) => {
          const { wafa, startPage, endPage } = row.original;
          return (
            <div className="text-sm">
              {wafa ? (
                <div className="font-medium">{`${wafa.name} (Hal ${startPage} - ${endPage})`}</div>
              ) : (
                <span>-</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'submissionStatus',
        id: 'Status',
        header: 'Status',
        filterFn: (row, columnId, value) => {
          if (!value || value === 'all') return true;
          const status = row.getValue(columnId);
          return status === value;
        },
        cell: ({ row }) => {
          const status = row.original.submissionStatus;
          const statusConfig = {
            [SubmissionStatus.LULUS]: { icon: CheckCircle2Icon, color: 'text-green-500' },
            [SubmissionStatus.MENGULANG]: { icon: RefreshCcw, color: 'text-yellow-500' },
            [SubmissionStatus.TIDAK_LULUS]: { icon: XCircle, color: 'text-red-500' },
          };

          const { icon: Icon, color } = statusConfig[status];

          return (
            <Badge variant="outline" className="flex gap-1 text-muted-foreground">
              <Icon className={color} />
              {status.replaceAll('_', ' ')}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'adab',
        id: 'Adab',
        header: 'Adab',
        filterFn: (row, columnId, value) => {
          if (!value || value === 'all') return true;
          const adab = row.getValue(columnId);
          return adab === value;
        },
        cell: ({ row }) => {
          const adab = row.original.adab;
          const adabConfig = {
            [Adab.BAIK]: { icon: ThumbsUp, color: 'text-green-500' },
            [Adab.KURANG_BAIK]: { icon: MinusCircle, color: 'text-yellow-500' },
            [Adab.TIDAK_BAIK]: { icon: ThumbsDown, color: 'text-red-500' },
          };

          const { icon: Icon, color } = adabConfig[adab];

          return (
            <Badge variant="outline" className="flex gap-1 text-muted-foreground">
              <Icon className={color} />
              {adab.replaceAll('_', ' ')}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'note',
        id: 'Catatan',
        header: 'Catatan',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.note || '-'}</span>
        ),
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

        <Select value={selectedGroupId} onValueChange={handleGroupChange}>
          <Label className="mb-2 block sr-only">Filter Kelompok</Label>
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

        <Select
          disabled={selectedGroupId === 'all'}
          value={selectedStudent}
          onValueChange={handleStudentChange}
        >
          <Label className="mb-2 block sr-only">Filter Siswa</Label>
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

        <Select value={selectedSubmissionType} onValueChange={handleSubmissionTypeChange}>
          <Label className="mb-2 block sr-only">Filter Jenis Setoran</Label>
          <SelectTrigger className="min-w-[200px]">
            <SelectValue placeholder="Pilih Jenis Setoran" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Jenis Setoran</SelectItem>
            {availableSubmissionTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type.replaceAll('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={handleStatusChange}>
          <Label className="mb-2 block sr-only">Filter Status</Label>
          <SelectTrigger className="min-w-[180px]">
            <SelectValue placeholder="Pilih Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            {availableStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status.replaceAll('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedAdab} onValueChange={handleAdabChange}>
          <Label className="mb-2 block sr-only">Filter Adab</Label>
          <SelectTrigger className="min-w-[180px]">
            <SelectValue placeholder="Pilih Adab" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Adab</SelectItem>
            {availableAdabs.map((adab) => (
              <SelectItem key={adab} value={adab}>
                {adab.replaceAll('_', ' ')}
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
