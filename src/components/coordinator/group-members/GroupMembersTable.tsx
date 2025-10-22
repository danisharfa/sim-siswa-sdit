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
import { Button } from '@/components/ui/button';
import { FileCheck, Trash2 } from 'lucide-react';
import { MemberAlertDialog } from '@/components/coordinator/group-members/MemberAlertDialog';
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
  groupId: string;
  onRefresh: () => void;
}

export function GroupMembersTable({ data, title, groupId, onRefresh }: Props) {
  const router = useRouter();
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
        id: 'actions',
        enableHiding: false,
        header: 'Aksi',
        cell: ({ row }) => {
          const student = row.original;
          return (
            <div className="flex gap-2">
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
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  router.push(
                    `/dashboard/coordinator/group/${groupId}/student/${student.id}/report`
                  )
                }
              >
                <FileCheck />
                Rapor
              </Button>
            </div>
          );
        },
      },
    ],
    [handleOpenDeleteDialog, router, groupId]
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
      <DataTable title={title} table={table} filterColumn="NIS" showColumnFilter={false}/>

      {dialogType === 'delete' && selectedMember && (
        <MemberAlertDialog
          member={selectedMember}
          groupId={groupId}
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
