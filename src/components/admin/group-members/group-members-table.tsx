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
import { MemberAlertDialog } from '@/components/admin/group-members/member-alert-dialog';
import { DataTablePagination } from '@/components/ui/table-pagination';

interface Siswa {
  id: string;
  nis: string;
  namaLengkap: string;
}

interface Props {
  siswa: Siswa[];
  title: string;
  groupId: string;
  onRefresh: () => void;
}

export function GroupMembersTable({ siswa, title, groupId, onRefresh }: Props) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const [selectedMember, setSelectedMember] = useState<Siswa | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = useMemo(() => {
    return siswa.filter(
      (s) =>
        s.nis.toLowerCase().includes(globalFilter.toLowerCase()) ||
        s.namaLengkap.toLowerCase().includes(globalFilter.toLowerCase())
    );
  }, [siswa, globalFilter]);

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
                    <span className="sr-only">Options</span>
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
            </>
          );
        },
      },
    ],
    []
  );

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
    <>
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
              <TableCaption>Daftar anggota kelompok.</TableCaption>
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

      {selectedMember && (
        <MemberAlertDialog
          member={selectedMember}
          groupId={groupId}
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
}
