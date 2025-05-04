// components/coordinator/exam/request/table.tsx
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
import { ExamRequestAlertDialog } from './alert-dialog';
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

interface ExamRequest {
  id: string;
  examType: 'SURAH' | 'JUZ';
  status: 'MENUNGGU' | 'DITERIMA' | 'DITOLAK';
  notes?: string;
  createdAt: string;
  student: {
    nis: string;
    user: {
      fullName: string;
    };
  };
  teacher: {
    user: {
      fullName: string;
    };
  };
  surah?: {
    name: string;
  };
  juz?: {
    name: string;
  };
}

interface ExamRequestTableProps {
  data: ExamRequest[];
  title: string;
  onRefresh: () => void;
}

export function ExamRequestTable({ data, title, onRefresh }: ExamRequestTableProps) {
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
  } = useDataTableState<ExamRequest, 'accept' | 'reject'>();
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'MENUNGGU' | 'DITERIMA' | 'DITOLAK'>(
    'ALL'
  );

  const handleOpenAcceptDialog = useCallback(
    (request: ExamRequest) => {
      setSelectedRequest(request);
      setDialogType('accept');
    },
    [setDialogType, setSelectedRequest]
  );

  const handleOpenRejectDialog = useCallback(
    (request: ExamRequest) => {
      setSelectedRequest(request);
      setDialogType('reject');
    },
    [setDialogType, setSelectedRequest]
  );

  const columns = useMemo<ColumnDef<ExamRequest>[]>(() => {
    const cols: ColumnDef<ExamRequest>[] = [
      {
        accessorKey: 'student.user.fullName',
        id: 'Nama Siswa',
        header: 'Nama Siswa',
        cell: ({ row }) => row.original.student.user.fullName,
      },
      {
        accessorKey: 'student.nis',
        header: 'NIS',
      },
      {
        accessorKey: 'teacher.user.fullName',
        id: 'Guru Pengusul',
        header: 'Guru Pengusul',
        cell: ({ row }) => row.original.teacher.user.fullName,
      },
      {
        accessorKey: 'examType',
        header: 'Jenis',
        cell: ({ row }) => (
          <Badge variant="outline" className="text-muted-foreground">
            {row.original.examType === 'SURAH'
              ? `Surah: ${row.original.surah?.name}`
              : `Juz: ${row.original.juz?.name}`}
          </Badge>
        ),
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
      {
        accessorKey: 'createdAt',
        header: 'Tanggal',
        cell: ({ row }) =>
          new Date(row.original.createdAt).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
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
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        <div>
          <Label>Pilih Status Permintaan</Label>
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
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable title={title} table={table} filterColumn="Nama Siswa" />

      {dialogType === 'accept' && selectedRequest && (
        <ExamRequestAlertDialog
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
        <ExamRequestAlertDialog
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
