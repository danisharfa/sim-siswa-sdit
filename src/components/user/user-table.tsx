'use client';

import * as React from 'react';
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, MoreVerticalIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { EditUserDialog } from '@/components/user/edit-user-dialog';
import { UserAlertDialog } from '@/components/user/user-alert-dialog';
import { useRouter } from 'next/navigation';

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
  fetchUsers: () => void;
}

export function UserTable({ users, title, role, fetchUsers }: Props) {
  const router = useRouter();

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');

  // State untuk menyimpan user yang dipilih & jenis dialog yang terbuka
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [dialogType, setDialogType] = React.useState<
    'edit' | 'reset' | 'delete' | null
  >(null);

  // Format tanggal di client
  const formatDate = React.useCallback((dateString: string) => {
    if (typeof window === 'undefined') return 'Loading...'; // SSR-safe
    return new Date(dateString).toLocaleDateString();
  }, []);

  // Filter data berdasarkan role dan username
  const filteredUsers = React.useMemo(() => {
    return users.filter(
      (user) =>
        user.role === role &&
        user.username.toLowerCase().includes(globalFilter.toLowerCase())
    );
  }, [users, role, globalFilter]);

  const columns = React.useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: 'username',
        header: 'Username',
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
            Tangal Dibuat <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <span>{formatDate(row.getValue('createdAt'))}</span>,
      },
      {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => {
          const user = row.original;
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

              {/* Dialog muncul secara otomatis saat state berubah */}
              {dialogType === 'edit' && selectedUser && (
                <EditUserDialog
                  user={selectedUser}
                  open={true} // Dialog langsung terbuka
                  onOpenChange={(isOpen) => {
                    if (!isOpen) {
                      setDialogType(null);
                      setSelectedUser(null);
                    }
                  }}
                  onSave={() => {
                    fetchUsers();
                    setDialogType(null);
                    setSelectedUser(null);
                  }}
                />
              )}

              {dialogType === 'reset' && selectedUser && (
                <UserAlertDialog
                  userId={selectedUser.id}
                  type="reset"
                  open={true} // Dialog langsung terbuka
                  onOpenChange={(isOpen) => {
                    if (!isOpen) {
                      setDialogType(null);
                      setSelectedUser(null);
                    }
                  }}
                  onConfirm={() => {
                    fetchUsers();
                    setDialogType(null);
                    setSelectedUser(null);
                  }}
                />
              )}

              {dialogType === 'delete' && selectedUser && (
                <UserAlertDialog
                  userId={selectedUser.id}
                  type="delete"
                  open={true} // Dialog langsung terbuka
                  onOpenChange={(isOpen) => {
                    if (!isOpen) {
                      setDialogType(null);
                      setSelectedUser(null);
                    }
                  }}
                  onConfirm={() => {
                    fetchUsers();
                    setDialogType(null);
                    setSelectedUser(null);
                  }}
                />
              )}
            </>
          );
        },
      },
    ],
    [formatDate, fetchUsers, selectedUser, dialogType, router]
  );

  const table = useReactTable({
    data: filteredUsers,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">{title}</h2>
      </CardHeader>
      <CardContent>
        <div className="py-2">
          <Input
            placeholder="Cari username..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full md:w-1/2"
          />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableCaption>
              Daftar {role === 'teacher' ? 'guru' : 'siswa'} dalam sistem.
              Total: {filteredUsers.length}
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
        <div className="flex items-center justify-between space-x-2 py-4">
          <span className="text-sm">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </span>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
