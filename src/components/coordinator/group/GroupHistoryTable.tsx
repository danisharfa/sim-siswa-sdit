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
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
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
  const columns = useMemo<ColumnDef<GroupHistoryItem>[]>(
    () => [
      {
        accessorKey: 'groupName',
        header: 'Nama Kelompok',
      },
      {
        accessorKey: 'classroomName',
        header: 'Nama Kelas',
      },
      {
        accessorKey: 'academicYear',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tahun Ajaran" />,
      },
      {
        accessorKey: 'semester',
        header: 'Semester',
      },
      {
        id: 'jumlahSiswa',
        header: 'Jumlah Siswa',
        cell: ({ row }) => row.original.students.length,
      },
      {
        id: 'students',
        header: 'Daftar Siswa',
        cell: ({ row }) => (
          <div className="space-y-1">
            {row.original.students.map((siswa) => (
              <div key={siswa.id} className="text-sm">
                <Badge variant="outline">{siswa.nis}</Badge> {siswa.fullName}
              </div>
            ))}
          </div>
        ),
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

  return <DataTable table={table} title={title} filterColumn="groupName" />;
}
