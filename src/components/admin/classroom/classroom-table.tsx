'use client';

import { useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Eye, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ClassroomEditDialog } from '@/components/admin/classroom/classroom-edit-dialog';
import { ClassroomAlertDialog } from '@/components/admin/classroom/classroom-alert-dialog';
import { useDataTableState } from '@/hooks/use-data-table';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { DataTable } from '@/components/ui/data-table';

interface Kelas {
  id: string;
  namaKelas: string;
  tahunAjaran: string;
}

interface Props {
  data: Kelas[];
  title: string;
  onRefresh: () => void;
}

export function ClassroomTable({ data, title, onRefresh }: Props) {
  const router = useRouter();

  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
    selectedItem: selectedKelas,
    setSelectedItem: setSelectedKelas,
    dialogType,
    setDialogType,
  } = useDataTableState<Kelas, 'edit' | 'delete'>();

  const handleOpenEditDialog = useCallback(
    (kelas: Kelas) => {
      setSelectedKelas(kelas);
      setDialogType('edit');
    },
    [setDialogType, setSelectedKelas]
  );

  const handleOpenDeleteDialog = useCallback(
    (kelas: Kelas) => {
      setSelectedKelas(kelas);
      setDialogType('delete');
    },
    [setDialogType, setSelectedKelas]
  );

  const columns = useMemo<ColumnDef<Kelas>[]>(
    () => [
      {
        accessorKey: 'namaKelas',
        id: 'Nama Kelas',
        header: 'Nama Kelas',
      },
      {
        accessorKey: 'tahunAjaran',
        id: 'Tahun Ajaran',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tahun Ajaran" />,
      },
      {
        id: 'actions',
        enableHiding: false,
        header: 'Aksi',
        cell: ({ row }) => {
          const kelas = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex size-8">
                  <MoreVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32 z-50">
                <DropdownMenuItem
                  onClick={() => router.push(`/dashboard/admin/classroom/${kelas.id}`)}
                  className="flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Detail
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleOpenEditDialog(kelas)}
                  className="flex items-center gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleOpenDeleteDialog(kelas)}
                  className="flex items-center gap-2"
                  variant="destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [router, handleOpenEditDialog, handleOpenDeleteDialog]
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
      <DataTable title={title} table={table} filterColumn="Nama Kelas" />

      {dialogType === 'edit' && selectedKelas && (
        <ClassroomEditDialog
          kelas={selectedKelas}
          open={true}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setDialogType(null);
              setSelectedKelas(null);
            }
          }}
          onSave={() => {
            onRefresh();
            setDialogType(null);
            setSelectedKelas(null);
          }}
        />
      )}

      {dialogType === 'delete' && selectedKelas && (
        <ClassroomAlertDialog
          kelas={selectedKelas}
          open={true}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setDialogType(null);
              setSelectedKelas(null);
            }
          }}
          onConfirm={() => {
            onRefresh();
            setDialogType(null);
            setSelectedKelas(null);
          }}
        />
      )}
    </>
  );
}
