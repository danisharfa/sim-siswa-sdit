import { useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Eye, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClassroomEditDialog } from '@/components/admin/classroom/ClassroomEditDialog';
import { ClassroomAlertDialog } from '@/components/admin/classroom/ClassroomAlertDialog';
import { useDataTableState } from '@/lib/hooks/use-data-table';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { DataTable } from '@/components/ui/data-table';
import { Semester } from '@prisma/client';

interface Classroom {
  id: string;
  name: string;
  academicYear: string;
  semester: Semester;
  studentCount: number;
  isActive: boolean;
}

interface Props {
  data: Classroom[];
  title: string;
  onRefresh: () => void;
}

export function ClassroomTable({ data, title, onRefresh }: Props) {
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
    selectedItem: selectedClassroom,
    setSelectedItem: setSelectedClassroom,
    dialogType,
    setDialogType,
  } = useDataTableState<Classroom, 'edit' | 'delete'>();

  const handleOpenEditDialog = useCallback(
    (classroom: Classroom) => {
      setSelectedClassroom(classroom);
      setDialogType('edit');
    },
    [setDialogType, setSelectedClassroom]
  );

  const handleOpenDeleteDialog = useCallback(
    (classroom: Classroom) => {
      setSelectedClassroom(classroom);
      setDialogType('delete');
    },
    [setDialogType, setSelectedClassroom]
  );

  const columns = useMemo<ColumnDef<Classroom>[]>(
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
        header: ({ column }) => <DataTableColumnHeader column={column} title="Jumlah Siswa" />,
        cell: ({ row }) => row.original.studentCount ?? 0,
      },
      {
        accessorKey: 'isActive',
        id: 'Status Kelas',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status Kelas" />,
        cell: ({ row }) =>
          row.original.isActive ? (
            <Badge variant="default">Aktif</Badge>
          ) : (
            <Badge variant="destructive">Tidak Aktif</Badge>
          ),
      },
      {
        id: 'actions',
        enableHiding: false,
        header: 'Aksi',
        cell: ({ row }) => {
          const classroom = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36 z-50">
                <DropdownMenuItem asChild>
                  <Link
                    href={`/dashboard/admin/classroom/${classroom.id}`}
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Detail
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleOpenEditDialog(classroom)}
                  className="flex items-center gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleOpenDeleteDialog(classroom)}
                  className="flex items-center gap-2"
                  variant="destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [handleOpenEditDialog, handleOpenDeleteDialog]
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
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <>
      <DataTable title={title} table={table} filterColumn="Nama Kelas" />

      {dialogType === 'edit' && selectedClassroom && (
        <ClassroomEditDialog
          classroom={selectedClassroom}
          open
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setDialogType(null);
              setSelectedClassroom(null);
            }
          }}
          onSave={() => {
            onRefresh();
            setDialogType(null);
            setSelectedClassroom(null);
          }}
        />
      )}

      {dialogType === 'delete' && selectedClassroom && (
        <ClassroomAlertDialog
          classroom={selectedClassroom}
          open
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setDialogType(null);
              setSelectedClassroom(null);
            }
          }}
          onConfirm={() => {
            onRefresh();
            setDialogType(null);
            setSelectedClassroom(null);
          }}
        />
      )}
    </>
  );
}
