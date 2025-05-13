'use client';

import { useMemo, useState } from 'react';
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
import { Semester, SubmissionType, SubmissionStatus, Adab } from '@prisma/client';
import { ExportToPDFButton } from './export-to-pdf-button';

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
};

interface Props {
  data: Submission[];
  title: string;
}

export function SubmissionHistoryTable({ data, title }: Props) {
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
  } = useDataTableState<Submission, string>();

  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [selectedWeek, setSelectedWeek] = useState<number | 'all'>('all');

  const groupList = useMemo(() => {
    const map = new Map<string, Submission['group']>();
    for (const d of data) {
      if (!map.has(d.group.id)) {
        map.set(d.group.id, d.group);
      }
    }
    return Array.from(map.values());
  }, [data]);

  const academicPeriods = useMemo(() => {
    return Array.from(
      new Set(data.map((d) => `${d.group.classroom.academicYear}-${d.group.classroom.semester}`))
    );
  }, [data]);

  const filteredGroups = useMemo(() => {
    if (selectedPeriod === 'all') return groupList;
    const [year, semester] = selectedPeriod.split('-');
    return groupList.filter(
      (d) => d.classroom.academicYear === year && d.classroom.semester === semester
    );
  }, [groupList, selectedPeriod]);

  const studentByGroup = useMemo(() => {
    if (selectedGroupId === 'all') return [];
    return Array.from(
      new Set(
        data.filter((d) => d.group.id === selectedGroupId).map((d) => d.student.user.fullName)
      )
    );
  }, [selectedGroupId, data]);

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
        accessorKey: 'student.nis',
        id: 'NIS',
        header: ({ column }) => <DataTableColumnHeader column={column} title="NIS" />,
      },
      {
        id: 'Nama Siswa',
        header: 'Nama Siswa',
        accessorFn: (row) => row.student.user.fullName,
      },
      {
        id: 'Kelompok',
        header: 'Kelompok',
        accessorFn: (row) => `${row.group.name} - ${row.group.classroom.name}`,
      },
      {
        id: 'Tahun Ajaran',
        header: 'Tahun Ajaran',
        accessorFn: (row) => `${row.group.classroom.academicYear} ${row.group.classroom.semester}`,
      },
      {
        accessorKey: 'submissionType',
        id: 'Jenis Setoran',
        header: 'Jenis Setoran',
        cell: ({ row }) => (
          <Badge variant="outline" className="text-muted-foreground px-2">
            {row.original.submissionType.replaceAll('_', ' ')}
          </Badge>
        ),
      },
      {
        id: 'Juz',
        header: 'Juz',
        accessorFn: (row) => row.juz?.name ?? '-',
      },
      {
        id: 'Surah',
        header: 'Surah',
        accessorFn: (row) => row.surah?.name ?? '-',
      },
      {
        accessorKey: 'startVerse',
        id: 'Ayat Mulai',
        header: 'Ayat Mulai',
        cell: ({ row }) => row.original.startVerse ?? '-',
      },
      {
        accessorKey: 'endVerse',
        id: 'Ayat Selesai',
        header: 'Ayat Selesai',
        cell: ({ row }) => row.original.endVerse ?? '-',
      },
      {
        id: 'Wafa',
        header: 'Wafa',
        accessorFn: (row) => row.wafa?.name ?? '-',
      },
      {
        accessorKey: 'startPage',
        id: 'Halaman Mulai',
        header: 'Halaman Mulai',
        cell: ({ row }) => row.original.startPage ?? '-',
      },
      {
        accessorKey: 'endPage',
        id: 'Halaman Selesai',
        header: 'Halaman Selesai',
        cell: ({ row }) => row.original.endPage ?? '-',
      },
      {
        accessorKey: 'submissionStatus',
        id: 'Status',
        header: 'Status',
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
        accessorKey: 'adab',
        header: 'Adab',
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
        header: 'Catatan',
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
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
  });

  return (
    <>
      <div className="grid grid-cols-1 sm:flex gap-4 mb-4">
        <Select
          onValueChange={(val) => {
            setSelectedPeriod(val);
            setSelectedGroupId('all');
            setSelectedStudent('all');
            table
              .getColumn('Tahun Ajaran')
              ?.setFilterValue(val === 'all' ? undefined : val.replace('-', ' '));
            table.getColumn('Kelompok')?.setFilterValue(undefined);
            table.getColumn('Nama Siswa')?.setFilterValue(undefined);
          }}
        >
          <SelectTrigger className="min-w-[220px]">
            <SelectValue placeholder="Pilih Tahun Ajaran + Semester" />
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

        <Select
          disabled={selectedPeriod === 'all'}
          onValueChange={(val) => {
            setSelectedGroupId(val);
            setSelectedStudent('all');
            const group = groupList.find((g) => g.id === val);
            if (group) {
              table
                .getColumn('Kelompok')
                ?.setFilterValue(`${group.name} - ${group.classroom.name}`);
              table
                .getColumn('Tahun Ajaran')
                ?.setFilterValue(`${group.classroom.academicYear} ${group.classroom.semester}`);
            }

            table.getColumn('Nama Siswa')?.setFilterValue(undefined);
          }}
        >
          <SelectTrigger className="min-w-[250px]">
            <SelectValue placeholder="Pilih Kelompok + Kelas" />
          </SelectTrigger>
          <SelectContent>
            {filteredGroups.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {`${g.name} - ${g.classroom.name}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          disabled={selectedGroupId === 'all'}
          value={selectedStudent}
          onValueChange={(val) => {
            setSelectedStudent(val);
            table.getColumn('Nama Siswa')?.setFilterValue(val === 'all' ? undefined : val);
          }}
        >
          <SelectTrigger className="min-w-[220px]">
            <SelectValue placeholder="Pilih Siswa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Siswa</SelectItem>
            {studentByGroup.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          onValueChange={(val) =>
            table.getColumn('Jenis Setoran')?.setFilterValue(val === 'all' ? undefined : val)
          }
        >
          <SelectTrigger className="min-w-[180px]">
            <SelectValue placeholder="Jenis Setoran" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Jenis</SelectItem>
            {Array.from(new Set(data.map((d) => d.submissionType))).map((st) => (
              <SelectItem key={st} value={st}>
                {st.replaceAll('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filter Bulan */}
        <Select
          onValueChange={(value) => {
            const val = value === 'all' ? 'all' : parseInt(value);
            setSelectedMonth(val);
            table.getColumn('Tanggal')?.setFilterValue('custom'); // trigger filter
          }}
        >
          <SelectTrigger className="min-w-[200px]">
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

        {/* Filter Minggu */}
        <Select
          onValueChange={(value) => {
            const val = value === 'all' ? 'all' : parseInt(value);
            setSelectedWeek(val);
            table.getColumn('Tanggal')?.setFilterValue('custom'); // trigger filter
          }}
        >
          <SelectTrigger className="min-w-[200px]">
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

      <div className="flex justify-end mb-4">
        <ExportToPDFButton table={table} />
      </div>

      <DataTable title={title} table={table} filterColumn="Tanggal" />
    </>
  );
}
