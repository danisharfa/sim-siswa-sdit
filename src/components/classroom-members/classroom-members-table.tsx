'use client';

import { useMemo, useState } from 'react';
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
import { ArrowUpDown, MoreVerticalIcon } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MemberAlertDialog } from '@/components/classroom-members/member-alert-dialog'; // Ganti path sesuai struktur proyekmu
import { DataTablePagination } from '../ui/table-pagination';

interface Siswa {
  id: string;
  nis: string;
  namaLengkap: string;
}

interface Props {
  siswa: Siswa[];
  title: string;
  kelasId: string;
  onRefresh: () => void; // Tambahkan sebagai prop
}

export function ClassroomMembersTable({
  siswa,
  title,
  kelasId,
  onRefresh,
}: Props) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const [selectedMember, setSelectedMember] = useState<Siswa | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Filter siswa berdasarkan NIS dan Nama Lengkap
  const filtered = useMemo(() => {
    return siswa.filter(
      (s) =>
        s.nis.toLowerCase().includes(globalFilter.toLowerCase()) ||
        s.namaLengkap.toLowerCase().includes(globalFilter.toLowerCase())
    );
  }, [siswa, globalFilter]);

  // Kolom tabel
  const columns = useMemo<ColumnDef<Siswa>[]>(
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
        accessorKey: 'nis',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="p-0"
          >
            NIS
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <span>{row.getValue('nis')}</span>,
        enableSorting: true,
      },
      {
        accessorKey: 'namaLengkap',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="p-0"
          >
            Nama Lengkap
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <span>{row.getValue('namaLengkap')}</span>,
        enableSorting: true,
      },
      {
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => {
          const siswa = row.original;
          return (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex size-8">
                    <MoreVerticalIcon />
                    <span className="sr-only">User Option</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32 z-50">
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedMember(siswa);
                      setDialogOpen(true);
                    }}
                    className="text-destructive"
                  >
                    Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {selectedMember && (
                <MemberAlertDialog
                  member={selectedMember}
                  kelasId={kelasId}
                  open={dialogOpen}
                  onOpenChange={(isOpen) => {
                    setDialogOpen(isOpen);
                    if (!isOpen) setSelectedMember(null);
                  }}
                  onConfirm={() => {
                    onRefresh();
                    setSelectedMember(null);
                  }}
                />
              )}
            </>
          );
        },
      },
    ],
    [selectedMember, dialogOpen, onRefresh, kelasId]
  );

  // React Table setup
  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">{title}</h2>
      </CardHeader>
      <CardContent>
        <Input
          placeholder="Cari NIS atau nama..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full md:w-1/2 mb-4"
        />
        <div className="rounded-md border">
          <Table>
            <TableCaption>Daftar siswa dalam sistem.</TableCaption>
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
        <DataTablePagination table={table} />
      </CardContent>
    </Card>
  );
}
