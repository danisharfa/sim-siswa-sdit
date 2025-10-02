'use client';

import { useCallback, useMemo } from 'react';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { ClassroomMembersAlertDialog } from '@/components/admin/classroom-members/ClassroomMembersAlertDialog'; // Ganti path sesuai struktur proyekmu
import { useDataTableState } from '@/lib/hooks/use-data-table';
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
  classroomId: string;
  onRefresh: () => void;
}

export function ClassroomMembersTable({ data, title, classroomId, onRefresh }: Props) {
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
    selectedItem: selectedMember,
    setSelectedItem: setSelectedMember,
    dialogType,
    setDialogType,
  } = useDataTableState<Student, 'delete'>();

  const handleOpenDeleteDialog = useCallback(
    (student: Student) => {
      setSelectedMember(student);
      setDialogType('delete');
    },
    [setDialogType, setSelectedMember]
  );

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
      {
        id: 'actions ',
        enableHiding: false,
        header: 'Aksi',
        cell: ({ row }) => {
          const student = row.original;
          return (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                handleOpenDeleteDialog(student);
              }}
            >
              <Trash2 />
              Hapus
            </Button>
          );
        },
      },
    ],
    [handleOpenDeleteDialog]
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
      <DataTable title={title} table={table} filterColumn="NIS" />

      {dialogType === 'delete' && selectedMember && (
        <ClassroomMembersAlertDialog
          member={selectedMember}
          classroomId={classroomId}
          open={true}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setDialogType(null);
              setSelectedMember(null);
            }
          }}
          onConfirm={() => {
            onRefresh();
            setDialogType(null);
            setSelectedMember(null);
          }}
        />
      )}
    </>
  );
}
