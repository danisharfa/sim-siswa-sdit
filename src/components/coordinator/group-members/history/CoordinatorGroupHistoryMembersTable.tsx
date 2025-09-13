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
import { ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Student {
  id: string;
  nis: string;
  fullName: string;
  group: {
    id: string;
    name: string;
    classroom: {
      academicYear: string;
      semester: string;
      name: string;
    };
  };
}

interface Props {
  data: Student[];
  title: string;
  groupId: string;
}

export function CoordinatorGroupHistoryMembersTable({ data, title, groupId }: Props) {
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
        id: 'NIS',
        header: ({ column }) => <DataTableColumnHeader column={column} title="NIS" />,
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
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                router.push(
                  `/dashboard/coordinator/group/${groupId}/history/student/${siswa.id}/report`
                )
              }
            >
              <ScrollText />
              Rapor
            </Button>
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
      <DataTable title={title} table={table} filterColumn="NIS" showColumnFilter={false} />
    </>
  );
}
