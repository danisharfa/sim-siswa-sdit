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
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { GroupAlertDialog } from './group-alert-dialog';
import { GroupEditDialog } from './group-edit-dialog';

interface Group {
  id: string;
  namaKelompok: string;
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
  const router = useRouter();
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [selectedGroup, setSelectedGroup] = React.useState<Group | null>(null);
  const [dialogType, setDialogType] = React.useState<'edit' | 'delete' | null>(
    null
  );

  const filteredGroups = React.useMemo(() => {
    return data.filter((group) =>
      group.namaKelompok?.toLowerCase().includes(globalFilter.toLowerCase())
    );
  }, [data, globalFilter]);

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
          >
            Tahun Ajaran
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ getValue }) => <span>{String(getValue())}</span>,
        enableSorting: true,
      },

      {
        header: 'Guru',
        accessorFn: (row) =>
          row.guruKelompok?.[0]?.guru?.user?.namaLengkap ?? '-',
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
                      router.push(`/dashboard/admin/group/${kelompok.id}`)
                    }
                  >
                    Detail
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedGroup(kelompok);
                      setDialogType('edit');
                    }}
                  >
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedGroup(kelompok);
                      setDialogType('delete');
                    }}
                    className="text-destructive"
                  >
                    Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {dialogType === 'edit' && selectedGroup && (
                <GroupEditDialog
                  kelompok={selectedGroup}
                  open={true}
                  onOpenChange={(isOpen) => {
                    if (!isOpen) {
                      setDialogType(null);
                      setSelectedGroup(null);
                    }
                  }}
                  onSave={() => {
                    onRefresh();
                    setDialogType(null);
                    setSelectedGroup(null);
                  }}
                />
              )}

              {dialogType === 'delete' && selectedGroup && (
                <GroupAlertDialog
                  kelompok={selectedGroup}
                  open={true}
                  onOpenChange={(isOpen) => {
                    if (!isOpen) {
                      setDialogType(null);
                      setSelectedGroup(null);
                    }
                  }}
                  onConfirm={() => {
                    onRefresh();
                    setDialogType(null);
                    setSelectedGroup(null);
                  }}
                />
              )}
            </>
          );
        },
      },
    ],
    [onRefresh, selectedGroup, dialogType, router]
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
