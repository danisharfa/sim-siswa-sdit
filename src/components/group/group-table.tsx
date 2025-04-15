'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { MoreVertical } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Group {
  id: string;
  nama: string;
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
  onRefresh: () => void;
}

export function GroupTable({ data, onRefresh }: GroupTableProps) {
  const [globalFilter, setGlobalFilter] = React.useState('');

  const filteredGroups = React.useMemo(() => {
    return data.filter((group) =>
      group.nama?.toLowerCase().includes(globalFilter.toLowerCase())
    );
  }, [data, globalFilter]);

  const columns = React.useMemo<ColumnDef<Group>[]>(
    () => [
      {
        accessorKey: 'nama',
        header: 'Nama Kelompok',
        cell: ({ row }) => <span>{row.original.nama}</span>,
      },
      {
        header: 'Kelas',
        accessorFn: (row) => row.kelas?.namaKelas ?? '-',
      },
      {
        header: 'Tahun Ajaran',
        accessorFn: (row) => row.kelas?.tahunAjaran ?? '-',
      },
      {
        header: 'Guru',
        accessorFn: (row) =>
          row.guruKelompok?.[0]?.guru?.user?.namaLengkap ?? '-',
      },
      {
        id: 'actions',
        header: 'Aksi',
        cell: () => (
          <MoreVertical className="w-5 h-5 text-muted-foreground cursor-pointer" />
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredGroups,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Daftar Kelompok</h2>
      </CardHeader>
      <CardContent>
        <div className="py-2">
          <Input
            placeholder="Cari kelompok..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full md:w-1/2"
          />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableCaption>
              Daftar Kelompok dalam sistem. Total: {filteredGroups.length}
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
