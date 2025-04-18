'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, MoreVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { UserEditDialog } from '@/components/user/user-edit-dialog';
import { UserAlertDialog } from '@/components/user/user-alert-dialog';
import { DataTablePagination } from '../ui/table-pagination';

interface User {
  id: string;
  username: string;
  namaLengkap: string;
  role: string;
  createdAt: string;
}

interface Props {
  users: User[];
  title: string;
  role: 'teacher' | 'student';
  onRefresh: () => void;
}

export function UserTable({ users, title, role, onRefresh }: Props) {
  const router = useRouter();

  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [dialogType, setDialogType] = React.useState<
    'edit' | 'reset' | 'delete' | null
  >(null);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );

  const columns = React.useMemo<ColumnDef<User>[]>(
    () => [
      {
        id: 'no',
        header: 'No',
        cell: ({ row, table }) =>
          row.index +
          1 +
          table.getState().pagination.pageIndex *
            table.getState().pagination.pageSize,
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'username',
        cell: ({ row }) => <span>{row.getValue('username')}</span>,
      },
      {
        accessorKey: 'namaLengkap',
        header: 'Nama Lengkap',
        cell: ({ row }) => <span>{row.getValue('namaLengkap')}</span>,
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Tanggal Dibuat
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <span>
            {new Date(row.getValue('createdAt')).toLocaleDateString()}
          </span>
        ),
      },
      {
        id: 'actions',
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
                <DropdownMenuContent align="end" className="w-32 z-50">
                  <DropdownMenuItem
                    onClick={() =>
                      router.push(`/dashboard/admin/users/${user.id}`)
                    }
                  >
                    Detail
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedUser(user);
                      setDialogType('edit');
                    }}
                  >
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedUser(user);
                      setDialogType('reset');
                    }}
                  >
                    Reset Password
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedUser(user);
                      setDialogType('delete');
                    }}
                    className="text-destructive"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

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
        },
      },
    ],
    [onRefresh, dialogType, selectedUser, router]
  );

  const table = useReactTable({
    data: users.filter((user) => user.role === role),
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">{title}</h2>
      </CardHeader>
      <CardContent>
        <div className="py-2">
          <Input
            placeholder="Filter username..."
            value={
              (table.getColumn('username')?.getFilterValue() as string) ?? ''
            }
            onChange={(event) =>
              table.getColumn('username')?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableCaption>
              Daftar {role === 'teacher' ? 'guru' : 'siswa'} dalam sistem.
            </TableCaption>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center">
                    Tidak ada hasil.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <DataTablePagination table={table} />
      </CardContent>
    </Card>
  );
}
