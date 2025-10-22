'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { KeyRound, MoreVertical, Pencil, SquareArrowOutUpRight, Trash2 } from 'lucide-react';
import { User } from '@/components/admin/user/UserManagement';
import { useDataTableState } from '@/lib/hooks/use-data-table';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { DataTable } from '@/components/ui/data-table';
import { UserEditDialog } from '@/components/admin/user/UserEditDialog';
import { UserAlertDialog } from '@/components/admin/user/UserAlertDialog';

interface Props {
  data: User[];
  title: string;
  onRefresh: () => void;
}

export function UserTable({ data, title, onRefresh }: Props) {
  const router = useRouter();

  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
    selectedItem: selectedUser,
    setSelectedItem: setSelectedUser,
    dialogType,
    setDialogType,
  } = useDataTableState<User, 'edit' | 'reset' | 'delete'>();

  const handleOpenEditDialog = useCallback(
    (user: User) => {
      setSelectedUser(user);
      setDialogType('edit');
    },
    [setSelectedUser, setDialogType]
  );

  const handleOpenResetDialog = useCallback(
    (user: User) => {
      setSelectedUser(user);
      setDialogType('reset');
    },
    [setSelectedUser, setDialogType]
  );

  const handleOpenDeleteDialog = useCallback(
    (user: User) => {
      setSelectedUser(user);
      setDialogType('delete');
    },
    [setSelectedUser, setDialogType]
  );

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: 'username',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Username" />,
      },
      {
        accessorKey: 'fullName',
        id: 'Nama Lengkap',
        header: 'Nama Lengkap',
      },
      {
        accessorKey: 'createdAt',
        id: 'Created At',
        header: 'Dibuat Pada',
        cell: ({ row }) => (
          <span>{new Date(row.getValue('Created At')).toLocaleDateString('id-ID')}</span>
        ),
      },
      {
        accessorKey: 'updatedAt',
        id: 'Updated At',
        header: 'Diperbarui Pada',
        cell: ({ row }) => (
          <span>{new Date(row.getValue('Updated At')).toLocaleDateString('id-ID')}</span>
        ),
      },
      ...(title === 'Daftar Siswa'
        ? [
            {
              accessorKey: 'graduatedAt',
              id: 'Graduated At',
              header: 'Tanggal Lulus',
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              cell: ({ row }: { row: any }) => {
                const graduatedAt = row.getValue('Graduated At');
                return (
                  <span>
                    {graduatedAt ? new Date(graduatedAt).toLocaleDateString('id-ID') : '-'}
                  </span>
                );
              },
            },
          ]
        : []),
      {
        id: 'actions',
        enableHiding: false,
        header: 'Aksi',
        cell: ({ row }) => {
          const user = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">User Option</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-50 z-50">
                <DropdownMenuItem
                  onClick={() => router.push(`/dashboard/admin/users/${user.id}`)}
                  className="flex items-center gap-2"
                >
                  <SquareArrowOutUpRight />
                  Detail
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleOpenEditDialog(user)}
                  className="flex items-center gap-2"
                >
                  <Pencil />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleOpenResetDialog(user)}
                  className="flex items-center gap-2"
                >
                  <KeyRound />
                  Reset Password
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleOpenDeleteDialog(user)}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Trash2 />
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [router, handleOpenEditDialog, handleOpenResetDialog, handleOpenDeleteDialog, title]
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

  return (
    <>
      <DataTable title={title} table={table} filterColumn="Nama Lengkap" showColumnFilter={false} />

      {dialogType === 'edit' && selectedUser && (
        <UserEditDialog
          user={selectedUser}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedUser(null);
              setDialogType(null);
            }
          }}
          onSave={() => {
            onRefresh();
            setSelectedUser(null);
            setDialogType(null);
          }}
        />
      )}

      {dialogType === 'reset' && selectedUser && (
        <UserAlertDialog
          user={selectedUser}
          type="reset"
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedUser(null);
              setDialogType(null);
            }
          }}
          onConfirm={() => {
            onRefresh();
            setSelectedUser(null);
            setDialogType(null);
          }}
        />
      )}

      {dialogType === 'delete' && selectedUser && (
        <UserAlertDialog
          user={selectedUser}
          type="delete"
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedUser(null);
              setDialogType(null);
            }
          }}
          onConfirm={() => {
            onRefresh();
            setSelectedUser(null);
            setDialogType(null);
          }}
        />
      )}
    </>
  );
}
