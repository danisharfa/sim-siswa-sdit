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
import { Eye, KeyRound, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { UserEditDialog } from '@/components/admin/user/user-edit-dialog';
import { UserAlertDialog } from '@/components/admin/user/user-alert-dialog';
import { useDataTableState } from '@/hooks/use-data-table';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { DataTable } from '@/components/ui/data-table';

interface User {
  id: string;
  username: string;
  namaLengkap: string;
  role: string;
  createdAt: string;
}

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
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Username" />
        ),
      },
      {
        accessorKey: 'namaLengkap',
        id: 'nama',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Nama Lengkap" />
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Created At',
        cell: ({ row }) => (
          <span>
            {new Date(row.getValue('createdAt')).toLocaleDateString('id-ID')}
          </span>
        ),
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
                    <span className="sr-only">User Option</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-50 z-50">
                  <DropdownMenuItem
                    onClick={() =>
                      router.push(`/dashboard/admin/users/${user.id}`)
                    }
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Detail
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleOpenEditDialog(user)}
                    className="flex items-center gap-2"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleOpenResetDialog(user)}
                    className="flex items-center gap-2"
                  >
                    <KeyRound className="w-4 h-4" />
                    Reset Password
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleOpenDeleteDialog(user)}
                    className="flex items-center gap-2 text-destructive"
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
    [
      router,
      handleOpenEditDialog,
      handleOpenResetDialog,
      handleOpenDeleteDialog,
    ]
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
      <DataTable title={title} table={table} filterColumn="nama" />

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
