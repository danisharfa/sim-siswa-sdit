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
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { DataTable } from '@/components/ui/data-table';
import { Semester } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { SquareArrowOutUpRight } from 'lucide-react';

interface HistoryClassroom {
  id: string;
  name: string;
  academicYear: string;
  semester: Semester;
  studentCount: number;
}

interface Props {
  data: HistoryClassroom[];
  title: string;
}

export function ClassroomHistoryTable({ data, title }: Props) {
  const router = useRouter();
  const columns = useMemo<ColumnDef<HistoryClassroom>[]>(
    () => [
      {
        accessorKey: 'name',
        id: 'Nama Kelas',
        header: 'Nama Kelas',
      },
      {
        accessorKey: 'academicYear',
        id: 'Tahun Ajaran',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tahun Ajaran" />,
      },
      {
        accessorKey: 'semester',
        id: 'Semester',
        header: 'Semester',
      },
      {
        accessorKey: 'studentCount',
        id: 'Jumlah Siswa',
        header: 'Jumlah Siswa',
      },
      {
        id: 'detail',
        enableHiding: false,
        header: 'Detail',
        cell: ({ row }) => {
          const classroom = row.original;
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/dashboard/admin/classroom/${classroom.id}/history`)}
            >
              <SquareArrowOutUpRight />
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
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <DataTable title={title} table={table} filterColumn="Nama Kelas" showColumnFilter={false} />
  );
}
