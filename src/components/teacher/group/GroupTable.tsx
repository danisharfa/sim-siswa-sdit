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
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDataTableState } from '@/lib/hooks/use-data-table';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { DataTable } from '@/components/ui/data-table';
import { Semester } from '@prisma/client';

interface Group {
  groupId: string;
  groupName: string;
  classroomName: string;
  classroomAcademicYear: string;
  classroomSemester: Semester;
  totalMember: number;
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
        accessorKey: 'groupName',
        id: 'Nama Kelompok',
        header: 'Nama Kelompok',
      },
      {
        accessorKey: 'classroomName',
        id: 'Nama Kelas',
        header: 'Nama Kelas',
      },
      {
        accessorKey: 'classroomAcademicYear',
        id: 'Tahun Ajaran',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tahun Ajaran" />,
      },
      {
        accessorKey: 'classroomSemester',
        id: 'Semester',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Semester" />,
      },
      {
        accessorKey: 'totalMember',
        id: 'Jumlah Siswa',
        header: 'Jumlah Siswa',
      },
      {
        id: 'detail',
        header: 'Detail',
        cell: ({ row }) => {
          const kelompok = row.original;
          return (
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => router.push(`/dashboard/teacher/group/${kelompok.groupId}`)}
            >
              <Eye />
            </Button>
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
      <DataTable
        title={title}
        table={table}
        filterColumn="Nama Kelompok"
        showColumnFilter={false}
      />
    </>
  );
}
