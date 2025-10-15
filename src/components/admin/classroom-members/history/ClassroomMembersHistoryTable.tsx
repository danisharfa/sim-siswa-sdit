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
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { DataTable } from '@/components/ui/data-table';

interface Student {
  id: string;
  nis: string;
  fullName: string;
}

interface Props {
  data: Student[];
  title: string;
  classroomId?: string;
  onRefresh?: () => void;
}

export function ClassroomMembersHistoryTable({ data, title }: Props) {
  const columns = useMemo<ColumnDef<Student>[]>(
    () => [
      {
        accessorKey: 'nis',
        id: 'NIS',
        header: 'NIS',
      },
      {
        accessorKey: 'fullName',
        id: 'Nama Siswa',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nama Siswa" />,
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <DataTable title={title} table={table} filterColumn="NIS" showColumnFilter={false} />
  );
}
