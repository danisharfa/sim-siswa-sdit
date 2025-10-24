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
import { Badge } from '@/components/ui/badge';
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
import { ExportToPDFButton } from './ExportToPDFButton';
import { Semester, SubmissionStatus, SubmissionType, Adab } from '@prisma/client';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { type DateRange } from 'react-day-picker';
import { Calendar23 } from '@/components/layout/calendar/calendar-23';

export type Submission = {
  id: string;
  date: string;
  submissionType: SubmissionType;
  juz: { name: string } | null;
  surah: { name: string } | null;
  wafa: { name: string } | null;
  startVerse: number | null;
  endVerse: number | null;
  startPage: number | null;
  endPage: number | null;
  submissionStatus: SubmissionStatus;
  adab: Adab;
  note: string | null;
  teacher: {
    user: {
      fullName: string;
    };
  };
  student: {
    nis: string;
    user: {
      fullName: string;
    };
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
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedAdab, setSelectedAdab] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const { data: setting } = useSWR('/api/academicSetting', fetcher);

  const academicPeriods = useMemo(() => {
    return Array.from(
      new Set(data.map((d) => `${d.group.classroom.academicYear}-${d.group.classroom.semester}`))
    );
  }, [data]);

  const defaultPeriod = setting ? `${setting.currentYear}-${setting.currentSemester}` : '';

  const filteredByPeriod = useMemo(() => {
    if (!selectedPeriod) return data;
    const [academicYear, semester] = selectedPeriod.split('-');
    return data.filter(
      (submission) =>
        submission.group.classroom.academicYear === academicYear &&
        submission.group.classroom.semester === semester
    );
  }, [data, selectedPeriod]);

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

  // Event handlers
  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
    setSelectedSubmissionType('all');
    setSelectedStatus('all');
    setSelectedAdab('all');
    // Clear table filters
    table.getColumn('Jenis Setoran')?.setFilterValue(undefined);
    table.getColumn('Status')?.setFilterValue(undefined);
    table.getColumn('Adab')?.setFilterValue(undefined);
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

  const currentPeriodInfo = useMemo(() => {
    if (!selectedPeriod) return null;

    const [academicYear, semester] = selectedPeriod.split('-');
    const foundData = data.find(
      (submission) =>
        submission.group.classroom.academicYear === academicYear &&
        submission.group.classroom.semester === semester
    );

    if (foundData) {
      return {
        period: {
          academicYear,
          semester,
          className: foundData.group.classroom.name,
          groupName: foundData.group.name,
          teacherName: foundData.teacher.user.fullName,
        },
      };
    }

    return null;
  }, [selectedPeriod, data]);

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
        accessorKey: 'submissionType',
        id: 'Jenis Setoran',
        header: 'Jenis Setoran',
        filterFn: (row, columnId, value) => {
          if (!value || value === 'all') return true;
          const submissionType = row.getValue(columnId);
          return submissionType === value;
        },
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.submissionType.replaceAll('_', ' ')}</Badge>
        ),
      },
      {
        id: 'Materi',
        header: 'Materi',
        accessorFn: (row) => {
          if (row.surah?.name) {
            return `${row.surah.name} (Ayat ${row.startVerse ?? '-'}${
              row.endVerse ? `–${row.endVerse}` : ''
            })`;
          } else if (row.wafa?.name) {
            return `${row.wafa.name} (Hal ${row.startPage ?? '-'}${
              row.endPage ? `–${row.endPage}` : ''
            })`;
          }
          return '-';
        },
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            {row.original.surah?.name ? (
              <>
                <span>{`${row.original.surah.name} (Ayat ${row.original.startVerse ?? '-'}${
                  row.original.endVerse ? `–${row.original.endVerse}` : ''
                })`}</span>
                {row.original.juz?.name && (
                  <span className="text-muted-foreground">{row.original.juz.name}</span>
                )}
              </>
            ) : row.original.wafa?.name ? (
              <span>{`${row.original.wafa.name} (Hal ${row.original.startPage ?? '-'}${
                row.original.endPage ? `–${row.original.endPage}` : ''
              })`}</span>
            ) : (
              <span>-</span>
            )}
          </div>
        ),
      },
      {
        id: 'Status',
        header: 'Status',
        accessorFn: (row) => row.submissionStatus,
        filterFn: (row, columnId, value) => {
          if (!value || value === 'all') return true;
          const status = row.getValue(columnId);
          return status === value;
        },
        cell: ({ row }) => {
          const status = row.original.submissionStatus;
          const icon =
            status === SubmissionStatus.LULUS ? (
              <CheckCircle2Icon className="text-green-500" />
            ) : status === SubmissionStatus.MENGULANG ? (
              <RefreshCcw className="text-yellow-500" />
            ) : (
              <XCircle className="text-red-500" />
            );
          return (
            <Badge variant="outline" className="flex gap-1 text-muted-foreground">
              {icon}
              {status.replaceAll('_', ' ')}
            </Badge>
          );
        },
      },
      {
        id: 'Adab',
        header: 'Adab',
        accessorFn: (row) => row.adab,
        filterFn: (row, columnId, value) => {
          if (!value || value === 'all') return true;
          const adab = row.getValue(columnId);
          return adab === value;
        },
        cell: ({ row }) => {
          const adab = row.original.adab;
          const icon =
            adab === Adab.BAIK ? (
              <ThumbsUp className="text-green-500" />
            ) : adab === Adab.KURANG_BAIK ? (
              <MinusCircle className="text-yellow-500" />
            ) : (
              <ThumbsDown className="text-red-500" />
            );
          return (
            <Badge variant="outline" className="flex gap-1 text-muted-foreground">
              {icon}
              {adab.replaceAll('_', ' ')}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'note',
        id: 'Catatan',
        header: 'Catatan',
        cell: ({ row }) => {
          const note = row.original.note;
          return <span className="text-muted-foreground">{note ? note : '-'}</span>;
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

        <ExportToPDFButton
          table={table}
          studentName={data[0]?.student?.user?.fullName}
          studentNis={data[0]?.student?.nis}
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

      {selectedPeriod && filteredByPeriod.length === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center mt-4">
          <p className="text-muted-foreground">
            Tidak ada data setoran untuk periode {selectedPeriod.replace('-', ' ')}.
          </p>
        </div>
      )}
    </>
  );
}
