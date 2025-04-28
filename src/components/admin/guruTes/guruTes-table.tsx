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
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2Icon, XCircle } from 'lucide-react';

interface GuruTes {
  id: string;
  guruId: string;
  aktif: boolean;
  guru: {
    nip: string;
    user: {
      namaLengkap: string;
      username: string;
    };
  };
}

interface GuruTesTableProps {
  data: GuruTes[];
  title: string;
  onRefresh: () => void;
}

export default function GuruTesTable({ data, title }: GuruTesTableProps) {
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
  } = useDataTableState<GuruTes, 'edit' | 'delete'>();

  const columns = useMemo<ColumnDef<GuruTes>[]>(
    () => [
      {
        accessorKey: 'guru.nip',
        id: 'NIP',
        header: 'NIP',
      },
      {
        accessorKey: 'guru.user.namaLengkap',
        id: 'Nama Lengkap',
        header: 'Nama Lengkap',
      },
      {
        accessorKey: 'guru.user.aktif',
        id: 'Status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className="flex gap-1 px-1.5 text-muted-foreground [&_svg]:size-3"
          >
            {row.original.aktif === true ? (
              <>
                <CheckCircle2Icon className="text-green-500 dark:text-green-400" />
                Aktif
              </>
            ) : (
              <>
                <XCircle className="text-red-500 dark:text-red-400" />
                Tidak Aktif
              </>
            )}
          </Badge>
        ),
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
      <DataTable title={title} table={table} filterColumn="nip" />
    </>
  );
}
