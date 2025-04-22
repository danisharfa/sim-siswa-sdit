'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpDown, MoreVertical } from 'lucide-react';
import {
  ColumnDef,
  SortingState,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// import { GroupAlertDialog } from './group-alert-dialog';
// import { GroupEditDialog } from './group-edit-dialog';

interface Group {
  id: string;
  namaKelompok: string;
  kelas: {
    namaKelas: string;
    tahunAjaran: string;
  };
  totalAnggota: number;
}

interface GroupTableProps {
  data: Group[];
  onRefresh: () => void;
}

export function GroupTable({ data }: GroupTableProps) {
  const router = useRouter();

  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = React.useMemo<ColumnDef<Group>[]>(
    () => [
      {
        accessorKey: 'namaKelompok',
        header: 'Nama Kelompok',
        cell: ({ row }) => <span>{row.original.namaKelompok}</span>,
      },
      {
        accessorFn: (row) => row.kelas?.namaKelas ?? '-',
        id: 'namaKelas',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className={'-ml-3'}
          >
            Kelas
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ getValue }) => <span>{String(getValue())}</span>,
        enableSorting: true,
      },
      {
        accessorFn: (row) => row.kelas?.tahunAjaran ?? '-',
        id: 'tahunAjaran',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className={'-ml-3'}
          >
            Tahun Ajaran
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ getValue }) => <span>{String(getValue())}</span>,
        enableSorting: true,
      },
      {
        accessorKey: 'totalAnggota',
        header: 'Jumlah Siswa',
        cell: ({ row }) => <span>{row.original.totalAnggota}</span>,
      },
      {
        id: 'actions',
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
                    onClick={() =>
                      router.push(`/dashboard/teacher/group/${kelompok.id}`)
                    }
                  >
                    Detail
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          );
        },
      },
    ],
    [router]
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Daftar Kelompok</h2>
      </CardHeader>
      <CardContent>
        <div className="py-2">
          <Input
            placeholder="Cari nama kelompok..."
            value={
              (table.getColumn('namaKelompok')?.getFilterValue() as string) ??
              ''
            }
            onChange={(e) =>
              table.getColumn('namaKelompok')?.setFilterValue(e.target.value)
            }
            className="w-full md:w-1/2"
          />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableCaption>
              Daftar Kelompok dalam sistem. Total:
              {table.getRowModel().rows.length}
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
                    Tidak ada kelompok tersedia.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
