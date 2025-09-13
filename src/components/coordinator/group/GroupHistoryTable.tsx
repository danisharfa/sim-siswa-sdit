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
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { Semester } from '@prisma/client';
import { Eye } from 'lucide-react';

interface StudentItem {
  id: string;
  nis: string;
  fullName: string;
}

interface GroupHistoryItem {
  groupId: string;
  groupName: string;
  teacherName: string;
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
        accessorKey: 'teacherName',
        id: 'Nama Guru Pembimbing',
        header: 'Nama Guru Pembimbing',
      },
      {
        accessorKey: 'studentCount',
        id: 'jumlah Siswa',
        header: 'Jumlah Siswa',
        cell: ({ row }) => row.original.students.length,
      },
      {
        id: 'detail',
        header: 'Detail',
        cell: ({ row }) => {
          const group = row.original;
          return (
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => router.push(`/dashboard/coordinator/group/${group.groupId}/history`)}
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
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <DataTable table={table} title={title} filterColumn="Nama Kelompok" showColumnFilter={false} />
  );
}
