'use client';

import { useEffect, useMemo, useState } from 'react';
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
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [selectedWeek, setSelectedWeek] = useState<number | 'all'>('all');
  const [selectedSubmissionType, setSelectedSubmissionType] = useState<SubmissionType | 'ALL'>(
    'ALL'
  );

  const { data: setting } = useSWR('/api/academicSetting', fetcher);

  const academicPeriods = useMemo(() => {
    return Array.from(
      new Set(data.map((d) => `${d.group.classroom.academicYear}-${d.group.classroom.semester}`))
    );
  }, [data]);

  const defaultPeriod = setting ? `${setting.currentYear}-${setting.currentSemester}` : '';

  const submissionTypeOptions = useMemo(() => {
    const set = new Set<SubmissionType>();
    for (const submission of data) {
      set.add(submission.submissionType);
    }
    return Array.from(set);
  }, [data]);

  useEffect(() => {
    if (defaultPeriod && !selectedPeriod) {
      if (academicPeriods.includes(defaultPeriod)) {
        setSelectedPeriod(defaultPeriod);
      } else if (academicPeriods.length > 0) {
        setSelectedPeriod(academicPeriods[0]);
      }
    }
  }, [defaultPeriod, academicPeriods, selectedPeriod]);

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

  const filteredData = useMemo(() => {
    if (!selectedPeriod) return data;

    const [academicYear, semester] = selectedPeriod.split('-');
    return data.filter(
      (submission) =>
        submission.group.classroom.academicYear === academicYear &&
        submission.group.classroom.semester === semester
    );
  }, [data, selectedPeriod]);

  function getWeekOfMonth(date: Date): number {
    const adjustedDate = date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return Math.ceil(adjustedDate / 7);
  }

  const columns = useMemo<ColumnDef<Submission>[]>(
    () => [
      {
        accessorKey: 'date',
        id: 'Tanggal',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
        filterFn: (row, columnId) => {
          const date = new Date(row.getValue(columnId));
          const matchMonth = selectedMonth === 'all' || date.getMonth() === selectedMonth;
          const matchWeek = selectedWeek === 'all' || getWeekOfMonth(date) === selectedWeek;
          return matchMonth && matchWeek;
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
        filterFn: (row, columnId) => {
          if (selectedSubmissionType === 'ALL') return true;
          return row.getValue(columnId) === selectedSubmissionType;
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
        header: 'Adab',
        accessorFn: (row) => row.adab,
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
    [selectedMonth, selectedWeek, selectedSubmissionType]
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
          <Label className="mb-2 block">Filter Periode</Label>
          <Select
            value={selectedPeriod}
            onValueChange={(val) => {
              setSelectedPeriod(val);
            }}
          >
            <SelectTrigger className="min-w-[200px]">
              <SelectValue placeholder="Pilih Periode" />
            </SelectTrigger>
            <SelectContent>
              {academicPeriods.map((period) => (
                <SelectItem key={period} value={period}>
                  {period.replace('-', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block">Filter Bulan</Label>
          <Select
            onValueChange={(value) => {
              const val = value === 'all' ? 'all' : parseInt(value);
              setSelectedMonth(val);
              table.getColumn('Tanggal')?.setFilterValue('custom');
            }}
          >
            <SelectTrigger className="min-w-[160px]">
              <SelectValue placeholder="Pilih Bulan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Bulan</SelectItem>
              {Array.from({ length: 12 }).map((_, i) => (
                <SelectItem key={i} value={i.toString()}>
                  {new Date(0, i).toLocaleString('id-ID', { month: 'long' })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block">Filter Minggu</Label>
          <Select
            onValueChange={(value) => {
              const val = value === 'all' ? 'all' : parseInt(value);
              setSelectedWeek(val);
              table.getColumn('Tanggal')?.setFilterValue('custom');
            }}
          >
            <SelectTrigger className="min-w-[160px]">
              <SelectValue placeholder="Pilih Minggu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Minggu</SelectItem>
              {[1, 2, 3, 4, 5].map((w) => (
                <SelectItem key={w} value={w.toString()}>
                  Minggu ke-{w}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block">Filter Jenis Setoran</Label>
          <Select
            value={selectedSubmissionType}
            onValueChange={(value) => {
              setSelectedSubmissionType(value as SubmissionType | 'ALL');
              table
                .getColumn('submissionType')
                ?.setFilterValue(value === 'ALL' ? undefined : value);
            }}
          >
            <SelectTrigger className="min-w-[180px]">
              <SelectValue placeholder="Pilih Jenis Setoran" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Jenis</SelectItem>
              {submissionTypeOptions.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.replaceAll('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {currentPeriodInfo && (
        <Card>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Periode</h4>
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

      <div className="flex justify-end mb-4">
        <ExportToPDFButton table={table} />
      </div>

      <DataTable title={title} table={table} />

      {selectedPeriod && filteredData.length === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center mt-4">
          <p className="text-muted-foreground">
            Tidak ada data setoran untuk periode {selectedPeriod.replace('-', ' ')}.
          </p>
        </div>
      )}
    </>
  );
}
