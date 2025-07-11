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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';
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
        header: ({ column }) => <DataTableColumnHeader column={column} title="Semester" />,
      },
      {
        accessorKey: 'students',
        id: 'Jumlah Siswa',
        header: 'Jumlah Siswa',
        cell: ({ row }) => row.original.students.length,
      },
      // {
      //   id: 'students',
      //   header: 'Daftar Siswa',
      //   cell: ({ row }) => (
      //     <div className="space-y-1">
      //       {row.original.students.map((siswa) => (
      //         <div key={siswa.id} className="text-sm">
      //           <Badge variant="outline">{siswa.nis}</Badge> {siswa.fullName}
      //         </div>
      //       ))}
      //     </div>
      //   ),
      // },
      {
        id: 'actions',
        enableHiding: false,
        header: 'Aksi',
        cell: ({ row }) => {
          const kelompok = row.original;
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
                      router.push(`/dashboard/teacher/group/${kelompok.groupId}/history`)
                    }
                  >
                    Detail
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
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

  return <DataTable table={table} title={title} filterColumn="Nama Kelompok" />;
}
