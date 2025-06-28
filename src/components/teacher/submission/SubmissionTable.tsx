'use client';

import { useCallback, useMemo, useState } from 'react';
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
  MoreVertical,
  Pencil,
  RefreshCcw,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useDataTableState } from '@/lib/hooks/use-data-table';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { DataTable } from '@/components/ui/data-table';
import { Semester, SubmissionType, SubmissionStatus, Adab } from '@prisma/client';
import { ExportToPDFButton } from './ExportToPDFButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { SubmissionEditDialog } from './SubmissionEditDialog';
import { SubmissionAlertDialog } from './SubmissionAlertDialog';
import { Label } from '@/components/ui/label';

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
  onRefresh: () => void;
}

export function SubmissionTable({ data, title, onRefresh }: Props) {
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
    selectedItem: selectedSubmission,
    setSelectedItem: setSelectedSubmission,
    dialogType,
    setDialogType,
  } = useDataTableState<Submission, 'edit' | 'delete'>();

  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [selectedWeek, setSelectedWeek] = useState<number | 'all'>('all');

  const handleOpenEditDialog = useCallback(
    (submission: Submission) => {
      setSelectedSubmission(submission);
      setDialogType('edit');
    },
    [setSelectedSubmission, setDialogType]
  );

  const handleOpenDeleteDialog = useCallback(
    (submission: Submission) => {
      setSelectedSubmission(submission);
      setDialogType('delete');
    },
    [setSelectedSubmission, setDialogType]
  );

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
        id: 'Tahun Ajaran',
        header: 'Tahun Ajaran',
        accessorFn: (row) => `${row.group.classroom.academicYear} ${row.group.classroom.semester}`,
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
        id: 'Catatan',
        header: 'Catatan',
        cell: ({ row }) => {
          const note = row.original.note;
          return <span className="text-muted-foreground">{note ? note : '-'}</span>;
        },
      },
      {
        id: 'actions',
        enableHiding: false,
        header: 'Aksi',
        cell: ({ row }) => {
          const user = row.original;
          return (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex size-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Target Option</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-50 z-50">
                  <DropdownMenuItem
                    onClick={() => handleOpenEditDialog(user)}
                    className="flex items-center gap-2"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleOpenDeleteDialog(user)}
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          );
        },
      },
    ],
    [selectedMonth, selectedWeek, handleOpenEditDialog, handleOpenDeleteDialog]
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
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <Label className="mb-2 block">Filter Tahun Ajaran</Label>
          <Select
            onValueChange={(val) => {
              setSelectedPeriod(val);
              setSelectedGroupId('all');
              setSelectedStudent('all');
              table
                .getColumn('Tahun Ajaran')
                ?.setFilterValue(val === 'all' ? undefined : val.replace('-', ' '));
              table.getColumn('Kelompok')?.setFilterValue(undefined);
              table.getColumn('Siswa')?.setFilterValue(undefined);
            }}
          >
            <SelectTrigger className="min-w-0 w-full sm:min-w-[220px]">
              <SelectValue placeholder="Pilih Tahun Ajaran" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tahun Ajaran</SelectItem>
              {academicPeriods.map((p) => (
                <SelectItem key={p} value={p}>
                  {p.replace('-', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block">Filter Kelompok</Label>
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
              table.getColumn('Siswa')?.setFilterValue(undefined);
            }}
          >
            <SelectTrigger className="min-w-0 w-full sm:min-w-[250px]">
              <SelectValue placeholder="Pilih Kelompok" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kelompok</SelectItem>
              {filteredGroups.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {`${g.name} - ${g.classroom.name}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block">Filter Siswa</Label>
          <Select
            disabled={selectedGroupId === 'all'}
            value={selectedStudent}
            onValueChange={(val) => {
              setSelectedStudent(val);
              table.getColumn('Siswa')?.setFilterValue(val === 'all' ? undefined : val);
            }}
          >
            <SelectTrigger className="min-w-0 w-full sm:min-w-[220px]">
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
        </div>

        <div>
          <Label className="mb-2 block">Filter Jenis Setoran</Label>
          <Select
            onValueChange={(val) =>
              table.getColumn('Jenis Setoran')?.setFilterValue(val === 'all' ? undefined : val)
            }
          >
            <SelectTrigger className="min-w-0 w-full sm:min-w-[180px]">
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
            <SelectTrigger className="min-w-0 w-full sm:min-w-[200px]">
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
            <SelectTrigger className="min-w-0 w-full sm:min-w-[200px]">
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
          <ExportToPDFButton table={table} />
        </div>
      </div>

      <DataTable title={title} table={table} filterColumn="Tanggal" />

      {dialogType === 'edit' && selectedSubmission && (
        <SubmissionEditDialog
          submission={{
            ...selectedSubmission,
            juz:
              selectedSubmission.juz === null
                ? undefined
                : {
                    id: selectedSubmission.juz.id,
                    name: selectedSubmission.juz.name,
                  },
            surah:
              selectedSubmission.surah === null
                ? undefined
                : {
                    id: selectedSubmission.surah.id,
                    name: selectedSubmission.surah.name,
                  },
            wafa:
              selectedSubmission.wafa === null
                ? undefined
                : {
                    id: selectedSubmission.wafa.id,
                    name: selectedSubmission.wafa.name,
                  },
            startVerse:
              selectedSubmission.startVerse === null ? undefined : selectedSubmission.startVerse,
            endVerse:
              selectedSubmission.endVerse === null ? undefined : selectedSubmission.endVerse,
            startPage:
              selectedSubmission.startPage === null ? undefined : selectedSubmission.startPage,
            endPage: selectedSubmission.endPage === null ? undefined : selectedSubmission.endPage,
            note: selectedSubmission.note === null ? undefined : selectedSubmission.note,
          }}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedSubmission(null);
              setDialogType(null);
            }
          }}
          onSave={() => {
            onRefresh();
            setSelectedSubmission(null);
            setDialogType(null);
          }}
        />
      )}
      {dialogType === 'delete' && selectedSubmission && (
        <SubmissionAlertDialog
          submission={selectedSubmission}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedSubmission(null);
              setDialogType(null);
            }
          }}
          onConfirm={() => {
            onRefresh();
            setSelectedSubmission(null);
            setDialogType(null);
          }}
        />
      )}
    </>
  );
}
