'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
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
import { EditClassroomDialog } from '@/components/classroom/edit-classroom-dialog';
import { ClassroomAlertDialog } from '@/components/classroom/classroom-alert-dialog';

interface Kelas {
  id: string;
  namaKelas: string;
  tahunAjaran: string;
}

interface KelasTableTanstackProps {
  data: Kelas[];
  onRefresh: () => void;
}

export function ClassroomTable({ data, onRefresh }: KelasTableTanstackProps) {
  const router = useRouter();
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [selectedKelas, setSelectedKelas] = React.useState<Kelas | null>(null);
  const [dialogType, setDialogType] = React.useState<'edit' | 'delete' | null>(
    null
  );

  const filteredKelas = React.useMemo(() => {
    return data.filter((kelas) =>
      kelas.namaKelas.toLowerCase().includes(globalFilter.toLowerCase())
    );
  }, [data, globalFilter]);

  const columns = React.useMemo<ColumnDef<Kelas>[]>(
    () => [
      {
        accessorKey: 'namaKelas',
        header: 'Nama Kelas',
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
                      router.push(`/dashboard/admin/classroom/${kelas.id}`)
                    }
                  >
                    Detail
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedKelas(kelas);
                      setDialogType('edit');
                    }}
                  >
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedKelas(kelas);
                      setDialogType('delete');
                    }}
                    className="text-destructive"
                  >
                    Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {dialogType === 'edit' && selectedKelas && (
                <EditClassroomDialog
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
                  kelasId={selectedKelas.id}
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
        },
      },
    ],
    [onRefresh, selectedKelas, dialogType, router]
  );

  const table = useReactTable({
    data: filteredKelas,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Daftar Kelas</h2>
      </CardHeader>
      <CardContent>
        <div className="py-2">
          <Input
            placeholder="Cari kelas..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full md:w-1/2"
          />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableCaption>
              Daftar Kelas dalam sistem. Total: {filteredKelas.length}
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
                    Tidak ada kelas tersedia.
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
