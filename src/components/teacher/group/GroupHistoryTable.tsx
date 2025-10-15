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
import { Button } from '@/components/ui/button';
import { SquareArrowOutUpRight } from 'lucide-react';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { DataTable } from '@/components/ui/data-table';
import { Semester } from '@prisma/client';

interface StudentItem {
  id: string;
  nis: string;
  fullName: string;
}

interface GroupHistoryItem {
  groupId: string;
  groupName: string;
  classroomName: string;
  academicYear: string;
  semester: Semester;
  students: StudentItem[];
}

interface Props {
  data: GroupHistoryItem[];
  title: string;
}

export function GroupHistoryTable({ data, title }: Props) {
  const router = useRouter();

  const columns = useMemo<ColumnDef<GroupHistoryItem>[]>(
    () => [
      {
        accessorKey: 'groupName',
        id: 'Nama Kelompok',
        header: 'Nama Kelompok',
      },
      {
        accessorKey: 'classroomName',
        id: 'Nama Kelas',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nama Kelas" />,
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
        accessorKey: 'students',
        id: 'Jumlah Siswa',
        header: 'Jumlah Siswa',
        cell: ({ row }) => row.original.students.length,
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
              onClick={() => router.push(`/dashboard/teacher/group/${kelompok.groupId}/history`)}
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
    <DataTable table={table} title={title} filterColumn="Nama Kelompok" showColumnFilter={false} />
  );
}
