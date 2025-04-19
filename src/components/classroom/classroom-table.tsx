'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { ClassroomEditDialog } from '@/components/classroom/classroom-edit-dialog';
import { ClassroomAlertDialog } from '@/components/classroom/classroom-alert-dialog';
import { DataTablePagination } from '../ui/table-pagination';

interface Kelas {
  id: string;
  namaKelas: string;
  tahunAjaran: string;
}

interface Props {
  data: Kelas[];
  onRefresh: () => void;
}

export function ClassroomTable({ data, onRefresh }: Props) {
  const router = useRouter();
  const [selectedKelas, setSelectedKelas] = React.useState<Kelas | null>(null);
  const [dialogType, setDialogType] = React.useState<'edit' | 'delete' | null>(
    null
  );

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );

  const handleOpenEditDialog = (kelas: Kelas) => {
    setSelectedKelas(kelas);
    setDialogType('edit');
  };

  const handleOpenDeleteDialog = (kelas: Kelas) => {
    setSelectedKelas(kelas);
    setDialogType('delete');
  };

  const columns = React.useMemo<ColumnDef<Kelas>[]>(
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
        accessorKey: 'namaKelas',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Nama Kelas <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <span>{row.getValue('namaKelas')}</span>,
      },
      {
        accessorKey: 'tahunAjaran',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Tahun Ajaran <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <span>{row.getValue('tahunAjaran')}</span>,
      },
      {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => {
          const kelas = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex size-8">
                  <MoreVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32 z-50">
                <DropdownMenuItem
                  onClick={() =>
                    router.push(`/dashboard/admin/classroom/${kelas.id}`)
                  }
                >
                  Detail
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleOpenEditDialog(kelas)}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleOpenDeleteDialog(kelas)}
                  className="text-destructive"
                >
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <>
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Daftar Kelas</h2>
        </CardHeader>
        <CardContent>
          <div className="py-2">
            <Input
              placeholder="Cari nama kelas..."
              value={
                (table.getColumn('namaKelas')?.getFilterValue() as string) ?? ''
              }
              onChange={(e) =>
                table.getColumn('namaKelas')?.setFilterValue(e.target.value)
              }
              className="w-full md:w-1/2"
            />
          </div>
          <div className="rounded-md border">
            <Table>
              <TableCaption>Daftar Kelas dalam sistem.</TableCaption>
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
                      Tidak ada kelas tersedia.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <DataTablePagination table={table} />
        </CardContent>
      </Card>

      {dialogType === 'edit' && selectedKelas && (
        <ClassroomEditDialog
          kelas={selectedKelas}
          open={true}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setDialogType(null);
              setSelectedKelas(null);
            }
          }}
          onSave={() => {
            onRefresh();
            setDialogType(null);
            setSelectedKelas(null);
          }}
        />
      )}

      {dialogType === 'delete' && selectedKelas && (
        <ClassroomAlertDialog
          kelas={selectedKelas}
          open={true}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setDialogType(null);
              setSelectedKelas(null);
            }
          }}
          onConfirm={() => {
            onRefresh();
            setDialogType(null);
            setSelectedKelas(null);
          }}
        />
      )}
    </>
  );
}
