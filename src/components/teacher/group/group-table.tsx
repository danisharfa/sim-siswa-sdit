'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useDataTableState } from '@/hooks/use-data-table';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { DataTable } from '@/components/ui/data-table';

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
  title: string;
}

export function GroupTable({ data, title }: GroupTableProps) {
  const router = useRouter();
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
  } = useDataTableState<Group, string>();

  const columns = useMemo<ColumnDef<Group>[]>(
    () => [
      {
        accessorKey: 'namaKelompok',
        header: 'Nama Kelompok',
      },
      {
        accessorFn: (row) => row.kelas?.namaKelas ?? '-',
        id: 'kelas',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Nama Kelas" />
        ),
      },
      {
        accessorFn: (row) => row.kelas?.tahunAjaran ?? '-',
        id: 'tahunAjaran',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Tahun Ajaran" />
        ),
      },
      {
        accessorKey: 'totalAnggota',
        header: 'Jumlah Siswa',
      },
      {
        id: 'actions',
        enableHiding: false,
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
      <DataTable title={title} table={table} filterColumn="kelas" />
    </>
  );
}
