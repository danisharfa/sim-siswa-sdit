'use client';

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
  ColumnDef,
  SortingState,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';

type Submission = {
  id: string;
  tanggal: string;
  jenisSetoran: string;
  surahId: number;
  ayatMulai: number;
  ayatSelesai: number;
  status: string;
  adab: string;
  catatan: string;
  siswa: {
    nis: string;
    user: {
      namaLengkap: string;
    };
  };
  kelompok: {
    namaKelompok: string;
  };
};

interface SubmissionHistoryTableProps {
  data: Submission[];
}

export function SubmissionHistoryTable({ data }: SubmissionHistoryTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<Submission>[]>(
    () => [
      {
        accessorKey: 'tanggal',
        header: 'Tanggal',
        cell: ({ row }) => {
          const date = new Date(row.original.tanggal);
          return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });
        },
      },
      {
        accessorKey: 'siswa.user.namaLengkap',
        header: 'Nama Siswa',
        cell: ({ row }) => row.original.siswa.user.namaLengkap,
      },
      {
        accessorKey: 'siswa.nis',
        id: 'nis',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className={'-ml-3'}
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            NIS
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ getValue }) => <span>{String(getValue())}</span>,
        enableSorting: true,
      },
      {
        accessorKey: 'kelompok.namaKelompok',
        header: 'Kelompok',
        cell: ({ row }) => row.original.kelompok.namaKelompok,
      },
      {
        accessorKey: 'jenisSetoran',
        header: 'Jenis Setoran',
        cell: ({ row }) => row.original.jenisSetoran,
      },
      {
        accessorKey: 'surahId',
        header: 'Surah',
        cell: ({ row }) => row.original.surahId,
      },
      {
        accessorKey: 'ayatMulai',
        header: 'Ayat Mulai',
        cell: ({ row }) => row.original.ayatMulai,
      },
      {
        accessorKey: 'ayatSelesai',
        header: 'Ayat Selesai',
        cell: ({ row }) => row.original.ayatSelesai,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => row.original.status,
      },
      {
        accessorKey: 'adab',
        header: 'Adab',
        cell: ({ row }) => row.original.adab,
      },
      {
        accessorKey: 'catatan',
        header: 'Catatan',
        cell: ({ row }) => row.original.catatan,
      },
    ],
    []
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
        <h2 className="text-xl font-semibold">History Setoran</h2>
      </CardHeader>
      <CardContent>
        <div className="roundend-md border">
          <Table>
            <TableCaption>
              Daftar Setoran dalam sistem. Total:
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
                  <td colSpan={columns.length} className="text-center">
                    Tidak ada data
                  </td>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
