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
import { useDataTableState } from '@/lib/hooks/use-data-table';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { DataTable } from '@/components/ui/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Student {
  id: string;
  nis: string;
  fullName: string;
}

interface Props {
  data: Student[];
  title: string;
  groupId: string;
}

export function GroupMembersTable({ data, title, groupId }: Props) {
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
  } = useDataTableState<Student, string>();
  const router = useRouter();

  const columns = useMemo<ColumnDef<Student>[]>(
    () => [
      {
        accessorKey: 'nis',
        header: 'NIS',
      },
      {
        accessorKey: 'fullName',
        id: 'siswa',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nama Lengkap" />,
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
                    <MoreVertical />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32 z-50">
                  <DropdownMenuItem
                    onClick={() =>
                      router.push(`/dashboard/teacher/group/${groupId}/student/${siswa.id}/score`)
                    }
                  >
                    Nilai
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      router.push(`/dashboard/teacher/group/${groupId}/student/${siswa.id}/report`)
                    }
                  >
                    Rapor
                  </DropdownMenuItem>
                  {/* <DropdownMenuItem
                    onClick={() =>
                      router.push(`/dashboard/teacher/group/${groupId}/student/${siswa.id}/target`)
                    }
                  >
                    Target Setoran
                  </DropdownMenuItem> */}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          );
        },
      },
    ],
    [groupId, router]
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
      <DataTable title={title} table={table} filterColumn="nis" />
    </>
  );
}
