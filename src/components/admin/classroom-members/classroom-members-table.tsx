'use client';

import { useCallback, useMemo } from 'react';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { MoreVerticalIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MemberAlertDialog } from '@/components/admin/classroom-members/member-alert-dialog'; // Ganti path sesuai struktur proyekmu
import { useDataTableState } from '@/hooks/use-data-table';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { DataTable } from '@/components/ui/data-table';

interface Siswa {
  id: string;
  nis: string;
  namaLengkap: string;
}

interface Props {
  data: Siswa[];
  title: string;
  kelasId: string;
  onRefresh: () => void;
}

export function ClassroomMembersTable({
  data,
  title,
  kelasId,
  onRefresh,
}: Props) {
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
    selectedItem: selectedMember,
    setSelectedItem: setSelectedMember,
    dialogType,
    setDialogType,
  } = useDataTableState<Siswa, 'delete'>();

  const handleOpenDeleteDialog = useCallback(
    (siswa: Siswa) => {
      setSelectedMember(siswa);
      setDialogType('delete');
    },
    [setDialogType, setSelectedMember]
  );

  const columns = useMemo<ColumnDef<Siswa>[]>(
    () => [
      {
        accessorKey: 'nis',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="NIS" />
        ),
      },
      {
        accessorKey: 'namaLengkap',
        id: 'siswa',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Nama Lengkap" />
        ),
      },
      {
        id: 'actions',
        enableHiding: false,
        header: 'Aksi',
        cell: ({ row }) => {
          const siswa = row.original;
          return (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex size-8">
                    <MoreVerticalIcon />
                    <span className="sr-only">User Option</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32 z-50">
                  <DropdownMenuItem
                    onClick={() => {
                      handleOpenDeleteDialog(siswa);
                    }}
                    className="text-destructive"
                  >
                    Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          );
        },
      },
    ],
    [handleOpenDeleteDialog]
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
      <DataTable title={title} table={table} filterColumn="siswa" />

      {dialogType === 'delete' && selectedMember && (
        <MemberAlertDialog
          member={selectedMember}
          kelasId={kelasId}
          open={true}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setDialogType(null);
              setSelectedMember(null);
            }
          }}
          onConfirm={() => {
            onRefresh();
            setDialogType(null);
            setSelectedMember(null);
          }}
        />
      )}
    </>
  );
}
