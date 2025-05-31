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
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { DataTable } from '@/components/ui/data-table';
import { Semester } from '@prisma/client';

interface HistoryClassroom {
  id: string;
  name: string;
  academicYear: string;
  semester: Semester;
  students: {
    id: string;
    nis: string;
    fullName: string;
  }[];
}

interface Props {
  data: HistoryClassroom[];
  title: string;
}

export function ClassroomHistoryTable({ data, title }: Props) {
  const columns = useMemo<ColumnDef<HistoryClassroom>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nama Kelas" />,
      },
      {
        accessorKey: 'academicYear',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tahun Ajaran" />,
      },
      {
        accessorKey: 'semester',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Semester" />,
      },
      {
        id: 'jumlahSiswa',
        header: 'Jumlah Siswa',
        cell: ({ row }) => row.original.students.length,
      },
      {
        id: 'daftarSiswa',
        header: 'Daftar Siswa',
        cell: ({ row }) => (
          <div className="space-y-1 text-sm">
            {row.original.students.map((s) => (
              <div key={s.id} className="flex gap-1 items-center">
                <Badge variant="secondary">{s.nis}</Badge>
                <span>{s.fullName}</span>
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

  return <DataTable title={title} table={table} filterColumn="name" />;
}
