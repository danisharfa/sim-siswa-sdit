'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
import { GroupAlertDialog } from './group-alert-dialog';
import { GroupEditDialog } from './group-edit-dialog';
import { useDataTableState } from '@/lib/hooks/use-data-table';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { DataTable } from '@/components/ui/data-table';

interface Group {
  groupId: string;
  groupName: string;
  classroomName: string;
  classroomAcademicYear: string;
  nip: string[];
  teacherName: string[];
}

interface GroupTableProps {
  data: Group[];
  title: string;
  onRefresh: () => void;
}

export function GroupTable({ data, title, onRefresh }: GroupTableProps) {
  const router = useRouter();

  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
    selectedItem: selectedGroup,
    setSelectedItem: setSelectedGroup,
    dialogType,
    setDialogType,
  } = useDataTableState<Group, 'edit' | 'delete'>();

  const handleOpenEditDialog = useCallback(
    (group: Group) => {
      setSelectedGroup(group);
      setDialogType('edit');
    },
    [setDialogType, setSelectedGroup]
  );

  const handleOpenDeleteDialog = useCallback(
    (group: Group) => {
      setSelectedGroup(group);
      setDialogType('delete');
    },
    [setDialogType, setSelectedGroup]
  );

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
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nama Kelas" />,
      },
      {
        accessorKey: 'classroomAcademicYear',
        id: 'Tahun Ajaran',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tahun Ajaran" />,
      },
      {
        accessorKey: 'teacherName',
        id: 'Nama Guru',
        accessorFn: (row) => row.teacherName.join(', '),
        header: 'Nama Guru',
      },
      {
        id: 'actions',
        enableHiding: false,
        header: 'Aksi',
        cell: ({ row }) => {
          const group = row.original;
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
                    onClick={() => router.push(`/dashboard/coordinator/group/${group.groupId}`)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Detail
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      handleOpenEditDialog(group);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      handleOpenDeleteDialog(group);
                    }}
                    className="flex items-center gap-2"
                    variant="destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                    Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          );
        },
      },
    ],
    [router, handleOpenEditDialog, handleOpenDeleteDialog]
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
      <DataTable title={title} table={table} filterColumn="Nama Kelompok" />

      {dialogType === 'edit' && selectedGroup && (
        <GroupEditDialog
          group={selectedGroup}
          open={true}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setDialogType(null);
              setSelectedGroup(null);
            }
          }}
          onSave={() => {
            onRefresh();
            setDialogType(null);
            setSelectedGroup(null);
          }}
        />
      )}

      {dialogType === 'delete' && selectedGroup && (
        <GroupAlertDialog
          group={selectedGroup}
          open={true}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setDialogType(null);
              setSelectedGroup(null);
            }
          }}
          onConfirm={() => {
            onRefresh();
            setDialogType(null);
            setSelectedGroup(null);
          }}
        />
      )}
    </>
  );
}
