'use client';

import { useMemo } from 'react';

import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useDataTableState } from '@/hooks/use-data-table';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { DataTable } from '@/components/ui/data-table';

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
  title: string;
}

export function SubmissionHistoryTable({
  data,
  title,
}: SubmissionHistoryTableProps) {
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
  } = useDataTableState<Submission, string>();

  const columns = useMemo<ColumnDef<Submission>[]>(
    () => [
      {
        accessorKey: 'tanggal',
        header: 'Tanggal',
        cell: ({ row }) => (
          <span>
            {new Date(row.getValue('tanggal')).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        ),
      },
      {
        accessorKey: 'siswa.user.namaLengkap',
        id: 'siswa',
        header: 'Nama Siswa',
        cell: ({ row }) => row.original.siswa.user.namaLengkap,
      },
      {
        accessorKey: 'siswa.nis',
        id: 'nis',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="NIS" />
        ),
      },
      {
        accessorKey: 'kelompok.namaKelompok',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Kelompok" />
        ),
      },
      {
        accessorKey: 'jenisSetoran',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Jenis Setoran" />
        ),
      },
      {
        accessorKey: 'surahId',
      },
      {
        accessorKey: 'ayatMulai',
      },
      {
        accessorKey: 'ayatSelesai',
      },
      {
        accessorKey: 'status',
      },
      {
        accessorKey: 'adab',
      },
      {
        accessorKey: 'catatan',
      },
    ],
    []
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
    </>
  );
}
