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

import { useDataTableState } from '@/lib/hooks/use-data-table';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2Icon,
  MinusCircle,
  RefreshCcw,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from 'lucide-react';

type Submission = {
  id: string;
  date: string;
  submissionType: string;
  juzId: number;
  surahId: number;
  surah: {
    name: string;
  };
  juz: {
    id: number;
    name: string;
  };
  wafaId: number;
  wafa: {
    name: string;
  };
  startVerse: number;
  endVerse: number;
  startPage: number;
  endPage: number;
  submissionStatus: string;
  adab: string;
  note: string;
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
    };
  };
};

interface SubmissionHistoryTableProps {
  data: Submission[];
  title: string;
}

export function SubmissionHistoryTable({ data, title }: SubmissionHistoryTableProps) {
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
  } = useDataTableState<Submission, string>();

  const [selectedGroup, setSelectedGroup] = useState<string | 'all'>('all');
  const [selectedStudent, setSelectedStudent] = useState<string | 'all'>('all');

  const groupList = useMemo(
    () =>
      Array.from(
        new Map(
          data.map((d) => [
            d.group.name,
            {
              groupName: d.group.name,
              classroomName: d.group.classroom.name,
              classroomAcademicYear: d.group.classroom.academicYear,
            },
          ])
        ).values()
      ),
    [data]
  );

  const studentByGroup = useMemo(() => {
    if (selectedGroup === 'all') return [];
    return data.filter((d) => d.group.name === selectedGroup).map((d) => d.student.user.fullName);
  }, [selectedGroup, data]);

  // const formatSubmissionType = (type: string) =>
  //   type
  //     .replace(/_/g, ' ')
  //     .toUpperCase()
  //     .replace(/\b\w/g, (c) => c.toUpperCase());

  const columns = useMemo<ColumnDef<Submission>[]>(
    () => [
      {
        accessorKey: 'date',
        id: 'Tanggal',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
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
        accessorFn: (row) => row.student.user.fullName,
        header: 'Nama Siswa',
      },
      {
        accessorKey: 'group.name',
        id: 'Nama Kelompok',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Kelompok" />,
        cell: ({ row }) => {
          const group = row.original.group;
          const classroom = group.classroom;
          return `${group.name} - ${classroom.name} (${classroom.academicYear})`;
        },
      },
      {
        accessorKey: 'submissionType',
        id: 'Jenis Setoran',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Jenis Setoran" />,
        cell: ({ row }) => (
          <div className="w-32">
            <Badge variant="outline" className="px-1.5 text-muted-foreground">
              {row.original.submissionType.replaceAll('_', ' ')}
            </Badge>
          </div>
        ),
      },
      {
        accessorKey: 'juz.name',
        id: 'Juz',
        header: 'Juz',
        cell: ({ row }) => row.original.juz?.name ?? '-',
      },
      {
        accessorKey: 'surah.name',
        id: 'Surah',
        header: 'Surah',
        cell: ({ row }) => row.original.surah?.name ?? '-',
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
        accessorKey: 'wafa.name',
        id: 'Wafa',
        header: 'Wafa',
        cell: ({ row }) => row.original.wafa?.name ?? '-',
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
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className="flex gap-1 px-1.5 text-muted-foreground [&_svg]:size-3"
          >
            {row.original.submissionStatus === 'LULUS' ? (
              <CheckCircle2Icon className="text-green-500 dark:text-green-400" />
            ) : row.original.submissionStatus === 'MENGULANG' ? (
              <RefreshCcw className="text-yellow-500 dark:text-yellow-400" />
            ) : (
              <XCircle className="text-red-500 dark:text-red-400" />
            )}

            {row.original.submissionStatus.replaceAll('_', ' ')}
          </Badge>
        ),
      },
      {
        accessorKey: 'adab',
        header: 'Adab',
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className="flex gap-1 px-1.5 text-muted-foreground [&_svg]:size-3"
          >
            {row.original.adab === 'BAIK' ? (
              <ThumbsUp className="text-green-500 dark:text-green-400" />
            ) : row.original.adab === 'KURANG_BAIK' ? (
              <MinusCircle className="text-yellow-500 dark:text-yellow-400" />
            ) : (
              <ThumbsDown className="text-red-500 dark:text-red-400" />
            )}

            {row.original.adab.replaceAll('_', ' ')}
          </Badge>
        ),
      },
      {
        accessorKey: 'note',
        header: 'Catatan',
      },
    ],
    []
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
      <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-4 mb-4 w-full">
        {/* Filter Kelompok */}
        <Select
          onValueChange={(value) => {
            setSelectedGroup(value);
            table.getColumn('Nama Kelompok')?.setFilterValue(value === 'all' ? undefined : value);
            setSelectedStudent('all');
            table.getColumn('Nama Siswa')?.setFilterValue(undefined);
          }}
        >
          <SelectTrigger className="min-w-[200px] w-full sm:w-[300px]">
            <SelectValue placeholder="Pilih Kelompok" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kelompok</SelectItem>
            {groupList.map((group) => (
              <SelectItem
                key={`${group.groupName}-${group.classroomName}-${group.classroomAcademicYear}`}
                value={group.groupName}
              >
                {`${group.groupName} - ${group.classroomName} (${group.classroomAcademicYear})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filter Siswa (tergantung kelompok) */}
        <Select
          disabled={selectedGroup === 'all'}
          value={selectedStudent}
          onValueChange={(value) => {
            setSelectedStudent(value);
            table.getColumn('Nama Siswa')?.setFilterValue(value === 'all' ? undefined : value);
          }}
        >
          <SelectTrigger className="min-w-[200px] w-full sm:w-[250px]">
            <SelectValue placeholder="Pilih Siswa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Siswa</SelectItem>
            {Array.from(new Set(studentByGroup)).map((student) => (
              <SelectItem key={student} value={student}>
                {student}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filter Jenis Setoran */}
        <Select
          onValueChange={(value) =>
            table.getColumn('Jenis Setoran')?.setFilterValue(value === 'all' ? undefined : value)
          }
        >
          <SelectTrigger className="min-w-[200px] w-full sm:w-[200px]">
            <SelectValue placeholder="Jenis Setoran" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Jenis</SelectItem>
            {Array.from(new Set(data.map((d) => d.submissionType))).map((st) => (
              <SelectItem key={st} value={st}>
                {st}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable title={title} table={table} filterColumn="Tanggal" />
    </>
  );
}
