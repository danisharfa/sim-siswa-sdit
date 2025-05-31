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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';
import { RequestStatusAlertDialog } from './RequestStatusAlertDialog';
import { useDataTableState } from '@/lib/hooks/use-data-table';
import { DataTable } from '@/components/ui/data-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Semester, TashihRequestStatus, TashihType } from '@prisma/client';

interface TashihRequest {
  id: string;
  academicYear: string;
  semester: Semester;
  classroomName: string;
  groupName: string;
  status: TashihRequestStatus;
  notes?: string;
  createdAt: string;
  student: {
    nis: string;
    user: { fullName: string };
  };
  teacher: { user: { fullName: string } };
  tashihType?: TashihType;
  surah?: { name: string };
  juz?: { name: string };
  wafa?: { name: string };
  startPage?: number;
  endPage?: number;
}

interface TashihRequestTableProps {
  data: TashihRequest[];
  title: string;
  onRefresh: () => void;
}

export function TashihRequestTable({ data, title, onRefresh }: TashihRequestTableProps) {
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
    selectedItem: selectedRequest,
    setSelectedItem: setSelectedRequest,
    dialogType,
    setDialogType,
  } = useDataTableState<TashihRequest, 'accept' | 'reject'>();

  const [selectedYearSemester, setSelectedYearSemester] = useState<string | 'ALL'>('ALL');
  const [selectedGroup, setSelectedGroup] = useState<string | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<TashihRequestStatus | 'ALL'>('ALL');

  const yearSemesterOptions = useMemo(() => {
    const set = new Set<string>();
    for (const d of data) {
      if (d.academicYear && d.semester) {
        set.add(`${d.academicYear}__${d.semester}`);
      }
    }
    return Array.from(set);
  }, [data]);

  const groupOptions = useMemo(() => {
    if (selectedYearSemester === 'ALL') return [];
    return data
      .filter((d) => `${d.academicYear}__${d.semester}` === selectedYearSemester)
      .map((d) => `${d.groupName} - ${d.classroomName}`);
  }, [data, selectedYearSemester]);

  const handleOpenAcceptDialog = useCallback(
    (request: TashihRequest) => {
      setSelectedRequest(request);
      setDialogType('accept');
    },
    [setDialogType, setSelectedRequest]
  );

  const handleOpenRejectDialog = useCallback(
    (request: TashihRequest) => {
      setSelectedRequest(request);
      setDialogType('reject');
    },
    [setDialogType, setSelectedRequest]
  );

  const columns = useMemo<ColumnDef<TashihRequest>[]>(() => {
    const cols: ColumnDef<TashihRequest>[] = [
      {
        accessorKey: 'createdAt',
        id: 'Tanggal',
        header: 'Tanggal',
        cell: ({ row }) =>
          new Date(row.original.createdAt).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
      },
      {
        accessorKey: 'student.nis',
        id: 'NIS',
        header: 'NIS',
      },
      {
        accessorKey: 'student.user.fullName',
        id: 'Nama Siswa',
        header: 'Nama Siswa',
        cell: ({ row }) => row.original.student.user.fullName,
      },
      {
        id: 'Kelompok',
        header: 'Kelompok',
        accessorFn: (row) =>
          row.groupName && row.classroomName
            ? `${row.groupName} - ${row.classroomName}`
            : 'Tidak terdaftar',
      },
      {
        id: 'Tahun Ajaran',
        header: 'Tahun Ajaran',
        accessorFn: (row) =>
          row.academicYear && row.semester ? `${row.academicYear} ${row.semester}` : '-',
      },
      {
        accessorKey: 'teacher.user.fullName',
        id: 'Guru Pembimbing',
        header: 'Guru Pembimbing',
        cell: ({ row }) => (
          <Badge variant="secondary" className="w-fit">
            {row.original.teacher.user.fullName}
          </Badge>
        ),
      },
      {
        accessorKey: 'tashihType',
        header: 'Jenis Tashih',
        cell: ({ row }) => (
          <Badge variant="outline" className="w-fit">
            {row.original.tashihType === TashihType.ALQURAN ? "Al-Qur'an" : 'Wafa'}
          </Badge>
        ),
        enableColumnFilter: true,
      },
      {
        id: 'Materi',
        header: 'Materi Ujian',
        cell: ({ row }) => {
          const { tashihType, surah, juz, wafa, startPage, endPage } = row.original;
          if (tashihType === TashihType.ALQURAN) {
            return <Badge variant="outline">{`${surah?.name ?? '-'} (${juz?.name ?? '-'})`}</Badge>;
          }
          if (tashihType === TashihType.WAFA) {
            const label =
              startPage && endPage
                ? startPage === endPage
                  ? `Hal ${startPage}`
                  : `Hal ${startPage}-${endPage}`
                : '-';
            return <Badge variant="outline">{`${wafa?.name ?? '-'} (${label})`}</Badge>;
          }
          return <Badge variant="outline">-</Badge>;
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={
              row.original.status === TashihRequestStatus.DITERIMA
                ? 'text-green-500 border-green-500'
                : row.original.status === TashihRequestStatus.DITOLAK
                ? 'text-red-500 border-red-500'
                : row.original.status === TashihRequestStatus.SELESAI
                ? 'text-blue-500 border-blue-500'
                : 'text-yellow-500 border-yellow-500'
            }
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: 'notes',
        header: 'Catatan',
        cell: ({ row }) => row.original.notes || '-',
      },
    ];

    cols.push({
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => {
        const request = row.original;
        if (request.status !== 'MENUNGGU') return null;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex size-8 p-0">
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32 z-50">
              <DropdownMenuItem onClick={() => handleOpenAcceptDialog(request)}>
                Terima
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleOpenRejectDialog(request)}>
                Tolak
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    });

    return cols;
  }, [handleOpenAcceptDialog, handleOpenRejectDialog]);

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
      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <Label className="mb-2 block">Filter Tahun Ajaran</Label>
          <Select
            value={selectedYearSemester}
            onValueChange={(value) => {
              setSelectedYearSemester(value);
              table
                .getColumn('Tahun Ajaran')
                ?.setFilterValue(value === 'ALL' ? undefined : value.replace('__', ' '));
              setSelectedGroup('ALL');
              table.getColumn('Kelompok')?.setFilterValue(undefined);
            }}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Pilih Tahun Ajaran & Semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua</SelectItem>
              {yearSemesterOptions.map((val) => {
                const [year, sem] = val.split('__');
                return (
                  <SelectItem key={val} value={val}>
                    {year} {sem}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block">Filter Kelompok</Label>
          <Select
            value={selectedGroup}
            disabled={selectedYearSemester === 'ALL'}
            onValueChange={(value) => {
              setSelectedGroup(value);
              table.getColumn('Kelompok')?.setFilterValue(value === 'ALL' ? undefined : value);
            }}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Pilih Kelompok" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua</SelectItem>
              {Array.from(new Set(groupOptions)).map((val) => (
                <SelectItem key={val} value={val}>
                  {val}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block">Filter Jenis Tashih</Label>
          <Select
            onValueChange={(value) => {
              table.getColumn('tashihType')?.setFilterValue(value === 'ALL' ? undefined : value);
            }}
            defaultValue="ALL"
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Pilih Jenis Tashih" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua</SelectItem>
              <SelectItem value={TashihType.ALQURAN}>Al-Qur&apos;an</SelectItem>
              <SelectItem value={TashihType.WAFA}>Wafa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block">Filter Status</Label>
          <Select
            value={selectedStatus}
            onValueChange={(value) => {
              setSelectedStatus(value as typeof selectedStatus);
              table.getColumn('status')?.setFilterValue(value === 'ALL' ? undefined : value);
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Pilih Status Permintaan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua</SelectItem>
              <SelectItem value="MENUNGGU">Menunggu</SelectItem>
              <SelectItem value={TashihRequestStatus.DITERIMA}>Diterima</SelectItem>
              <SelectItem value={TashihRequestStatus.DITOLAK}>Ditolak</SelectItem>
              <SelectItem value={TashihRequestStatus.SELESAI}>Selesai</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable title={title} table={table} filterColumn="Nama Siswa" />

      {dialogType === 'accept' && selectedRequest && (
        <RequestStatusAlertDialog
          request={selectedRequest}
          type="accept"
          open={true}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setDialogType(null);
              setSelectedRequest(null);
            }
          }}
          onSave={() => {
            onRefresh();
            setDialogType(null);
            setSelectedRequest(null);
          }}
        />
      )}

      {dialogType === 'reject' && selectedRequest && (
        <RequestStatusAlertDialog
          request={selectedRequest}
          type="reject"
          open={true}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setDialogType(null);
              setSelectedRequest(null);
            }
          }}
          onSave={() => {
            onRefresh();
            setDialogType(null);
            setSelectedRequest(null);
          }}
        />
      )}
    </>
  );
}
