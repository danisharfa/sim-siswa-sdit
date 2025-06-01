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

const fetchSetting = async () => {
  const res = await fetch('/api/academicSetting');
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
};

export function SubmissionTable({ data, title }: Props) {
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
  } = useDataTableState<Submission, string>();

  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [selectedWeek, setSelectedWeek] = useState<number | 'all'>('all');

  const { data: setting } = useSWR('/api/academicSetting', fetchSetting);

  const academicPeriods = useMemo(() => {
    return Array.from(
      new Set(data.map((d) => `${d.group.classroom.academicYear}-${d.group.classroom.semester}`))
    );
  }, [data]);

  const defaultPeriod = setting ? `${setting.currentYear}-${setting.currentSemester}` : 'all';

  useEffect(() => {
    if (defaultPeriod !== 'all') {
      setSelectedPeriod(defaultPeriod);
    }
  }, [defaultPeriod]);

  function getWeekOfMonth(date: Date): number {
    const adjustedDate = date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return Math.ceil(adjustedDate / 7);
  }

  const columns = useMemo<ColumnDef<Submission>[]>(
    () => [
      {
        accessorKey: 'date',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
        filterFn: (row, columnId) => {
          const date = new Date(row.getValue(columnId));
          const matchMonth = selectedMonth === 'all' || date.getMonth() === selectedMonth;
          const matchWeek = selectedWeek === 'all' || getWeekOfMonth(date) === selectedWeek;
          return matchMonth && matchWeek;
        },
        cell: ({ row }) => (
          <span>
            {new Date(row.getValue('date')).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        ),
      },
      {
        id: 'Tahun Ajaran',
        header: 'Tahun Ajaran',
        accessorFn: (row) => `${row.group.classroom.academicYear} ${row.group.classroom.semester}`,
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">
              {row.original.group.classroom.academicYear} {row.original.group.classroom.semester}
            </div>
            <div className="text-muted-foreground">
              {row.original.group.name} - {row.original.group.classroom.name}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'submissionType',
        header: 'Jenis Setoran',
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.submissionType.replaceAll('_', ' ')}</Badge>
        ),
      },
      {
        id: 'Surah',
        header: 'Surah',
        accessorFn: (row) => row.surah?.name ?? '-',
        cell: ({ row }) => (
          <div className="text-sm">
            {row.original.surah?.name ? (
              <>
                <div className="font-medium">{`${row.original.surah.name} (Ayat ${row.original.startVerse} - ${row.original.endVerse})`}</div>
                <div className="text-muted-foreground">{row.original.juz?.name}</div>
              </>
            ) : (
              <span>-</span>
            )}
          </div>
        ),
      },
      {
        id: 'Wafa',
        header: 'Wafa',
        accessorFn: (row) => row.wafa?.name ?? '-',
        cell: ({ row }) => (
          <div className="text-sm">
            {row.original.wafa?.name ? (
              <>
                <div className="font-medium">{`${row.original.wafa.name} (Hal ${row.original.startPage} - ${row.original.endPage})`}</div>
              </>
            ) : (
              <span>-</span>
            )}
          </div>
        ),
      },
      {
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
    [selectedMonth, selectedWeek]
  );

  const table = useReactTable({
    data,
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

  useEffect(() => {
    if (selectedPeriod !== 'all') {
      table.getColumn('Tahun Ajaran')?.setFilterValue(selectedPeriod.replace('-', ' '));
    }
  }, [selectedPeriod, table]);

  return (
    <>
      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <Label className="mb-2 block">Filter Tahun Ajaran</Label>
          <Select
            value={selectedPeriod}
            onValueChange={(val) => {
              setSelectedPeriod(val);
              table
                .getColumn('Tahun Ajaran')
                ?.setFilterValue(val === 'all' ? undefined : val.replace('-', ' '));
            }}
          >
            <SelectTrigger className="min-w-[200px]">
              <SelectValue placeholder="Pilih Tahun Ajaran" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Periode</SelectItem>
              {academicPeriods.map((p) => (
                <SelectItem key={p} value={p}>
                  {p.replace('-', ' ')}
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
              table.getColumn('date')?.setFilterValue('custom');
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
              table.getColumn('date')?.setFilterValue('custom');
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
      </div>

      <div className="flex justify-end mb-4">
        <ExportToPDFButton table={table} />
      </div>

      <DataTable title={title} table={table} filterColumn="date" />
    </>
  );
}
