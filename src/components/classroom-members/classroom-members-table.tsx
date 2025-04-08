'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';

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
import { ArrowUpDown } from 'lucide-react'; // pastikan sudah di-import

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Member {
  id: string;
  identifier: string; // bisa NIP atau NIS
  namaLengkap: string;
  role: 'teacher' | 'student';
}

interface Props {
  members: Member[];
  title: string;
  role: 'teacher' | 'student';
}

export function ClassroomMembersTable({ members, title, role }: Props) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');

  const filtered = React.useMemo(() => {
    return members.filter(
      (m) =>
        m.role === role &&
        (m.identifier.toLowerCase().includes(globalFilter.toLowerCase()) ||
          m.namaLengkap.toLowerCase().includes(globalFilter.toLowerCase()))
    );
  }, [members, globalFilter, role]);

  const columns = React.useMemo<ColumnDef<Member>[]>(
    () => [
      {
        accessorKey: 'identifier',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className="p-0"
            >
              {role === 'teacher' ? 'NIP' : 'NIS'}
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => <span>{row.getValue('identifier')}</span>,
        enableSorting: true,
      },
      {
        accessorKey: 'namaLengkap',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className="p-0"
            >
              Nama Lengkap
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => <span>{row.getValue('namaLengkap')}</span>,
        enableSorting: true,
      },
    ],
    [role]
  );

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
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
        <Input
          placeholder={`Cari ${
            role === 'teacher' ? 'NIP atau nama' : 'NIS atau nama'
          }...`}
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full md:w-1/2 mb-4"
        />
        <div className="rounded-md border">
          <Table>
            <TableCaption>
              Daftar {role === 'teacher' ? 'guru' : 'siswa'} dalam sistem.
              Total: {filtered.length}
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
                    Tidak ada data.
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
