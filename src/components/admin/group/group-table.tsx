'use client';

import { useCallback, useMemo } from 'react';
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
import { GroupAlertDialog } from './group-alert-dialog';
import { GroupEditDialog } from './group-edit-dialog';
import { useDataTableState } from '@/lib/hooks/use-data-table';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { DataTable } from '@/components/ui/data-table';

interface Group {
  id: string;
  namaKelompok: string;
  kelas: {
    namaKelas: string;
    tahunAjaran: string;
  };
  guruKelompok: {
    guru: {
      user: {
        namaLengkap: string;
      };
    };
  }[];
}

interface GroupTableProps {
  data: Group[];
  title: string;
  onRefresh: () => void;
}

export function GroupTable({ data, title, onRefresh }: GroupTableProps) {
  const router = useRouter();

  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
    selectedItem: selectedGroup,
    setSelectedItem: setSelectedGroup,
    dialogType,
    setDialogType,
  } = useDataTableState<Group, 'edit' | 'delete'>();

  const handleOpenEditDialog = useCallback(
    (kelompok: Group) => {
      setSelectedGroup(kelompok);
      setDialogType('edit');
    },
    [setDialogType, setSelectedGroup]
  );

  const handleOpenDeleteDialog = useCallback(
    (kelompok: Group) => {
      setSelectedGroup(kelompok);
      setDialogType('delete');
    },
    [setDialogType, setSelectedGroup]
  );

  const columns = useMemo<ColumnDef<Group>[]>(
    () => [
      {
        accessorKey: 'namaKelompok',
        id: 'Nama Kelompok',
        header: 'Nama Kelompok',
      },
      {
        accessorKey: 'kelas.namaKelas',
        id: 'Nama Kelas',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nama Kelas" />,
      },
      {
        accessorKey: 'kelas.tahunAjaran',
        id: 'Tahun Ajaran',
        accessorFn: (row) => row.kelas?.tahunAjaran ?? '-',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tahun Ajaran" />,
      },

      {
        header: 'Nama Guru',
        id: 'Nama Guru',
        accessorFn: (row) => row.guruKelompok?.[0]?.guru?.user?.namaLengkap ?? '-',
      },
      {
        id: 'actions',
        enableHiding: false,
        header: 'Aksi',
        cell: ({ row }) => {
          const kelompok = row.original;
          return (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex size-8">
                    <MoreVertical />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32 z-50">
                  <DropdownMenuItem
                    onClick={() => router.push(`/dashboard/admin/group/${kelompok.id}`)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Detail
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      handleOpenEditDialog(kelompok);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      handleOpenDeleteDialog(kelompok);
                    }}
                    className="flex items-center gap-2"
                    variant="destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                    Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
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
      <DataTable title={title} table={table} filterColumn="Nama Kelompok" />

      {dialogType === 'edit' && selectedGroup && (
        <GroupEditDialog
          kelompok={selectedGroup}
          open={true}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setDialogType(null);
              setSelectedGroup(null);
            }
          }}
          onSave={() => {
            onRefresh();
            setDialogType(null);
            setSelectedGroup(null);
          }}
        />
      )}

      {dialogType === 'delete' && selectedGroup && (
        <GroupAlertDialog
          kelompok={selectedGroup}
          open={true}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setDialogType(null);
              setSelectedGroup(null);
            }
          }}
          onConfirm={() => {
            onRefresh();
            setDialogType(null);
            setSelectedGroup(null);
          }}
        />
      )}
    </>
  );
}
