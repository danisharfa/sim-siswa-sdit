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
import { RequestStatusAlertDialog } from './alert-dialog';
import { useDataTableState } from '@/lib/hooks/use-data-table';
// import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { DataTable } from '@/components/ui/data-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface TashihRequest {
  id: string;
  status: 'MENUNGGU' | 'DITERIMA' | 'DITOLAK' | 'SELESAI';
  notes?: string;
  createdAt: string;
  student: {
    nis: string;
    user: { fullName: string };
    group?: {
      name: string;
      classroom: { name: string; academicYear: string };
    };
  };
  teacher: { user: { fullName: string } };
  tashihType?: 'ALQURAN' | 'WAFA';
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
  const [selectedStatus, setSelectedStatus] = useState<
    'ALL' | 'MENUNGGU' | 'DITERIMA' | 'DITOLAK' | 'SELESAI'
  >('ALL');

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
        accessorKey: 'student.group.name',
        id: 'Kelompok & Kelas',
        header: 'Kelompok & Kelas',
        cell: ({ row }) => {
          const group = row.original.student.group;
          return (
            <Badge variant="secondary" className="w-fit">
              {group
                ? `${group.name} - ${group.classroom.name} (${group.classroom.academicYear})`
                : 'Tidak terdaftar'}
            </Badge>
          );
        },
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
            {row.original.tashihType === 'ALQURAN' ? "Al-Qur'an" : 'Wafa'}
          </Badge>
        ),
        enableColumnFilter: true,
      },

      {
        id: 'Materi',
        header: 'Materi Ujian',
        cell: ({ row }) => {
          const { tashihType, surah, juz, wafa, startPage, endPage } = row.original;

          if (tashihType === 'ALQURAN') {
            const surahName = surah?.name ?? '-';
            const juzName = juz?.name ? ` (${juz.name})` : '';
            return <Badge variant="outline">{`${surahName}${juzName}`}</Badge>;
          }

          if (tashihType === 'WAFA') {
            const pageLabel =
              startPage && endPage
                ? startPage === endPage
                  ? `Hal ${startPage}`
                  : `Hal ${startPage}-${endPage}`
                : '-';
            return <Badge variant="outline">{`${wafa?.name ?? '-'} (${pageLabel})`}</Badge>;
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
              row.original.status === 'DITERIMA'
                ? 'text-green-500 border-green-500'
                : row.original.status === 'DITOLAK'
                ? 'text-red-500 border-red-500'
                : row.original.status === 'SELESAI'
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
        id: 'Catatan',
        header: 'Catatan',
        cell: ({ row }) => row.original.notes || '-',
      },
    ];

    // Tambah kolom aksi jika status MENUNGGU
    cols.push({
      id: 'actions',
      enableHiding: false,
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
              <DropdownMenuItem
                onClick={() => handleOpenAcceptDialog(request)}
                className="flex items-center gap-2"
              >
                Terima
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleOpenRejectDialog(request)}
                className="flex items-center gap-2"
                variant="destructive"
              >
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
      <div className="flex flex-col sm:flex-row gap-4">
        <div>
          <Label>Filter Status</Label>
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
              <SelectItem value="DITERIMA">Diterima</SelectItem>
              <SelectItem value="DITOLAK">Ditolak</SelectItem>
              <SelectItem value="SELESAI">Selesai</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Filter Jenis Tashih</Label>
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
              <SelectItem value="ALQURAN">Al-Qur&apos;an</SelectItem>
              <SelectItem value="WAFA">Wafa</SelectItem>
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
