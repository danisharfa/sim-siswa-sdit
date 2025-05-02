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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVerticalIcon, Trash2 } from 'lucide-react';
import { MemberAlertDialog } from '@/components/admin/group-members/member-alert-dialog'; // Ganti path sesuai struktur proyekmu
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
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex size-8">
                    <MoreVerticalIcon />
                    <span className="sr-only">User Option</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32 z-50">
                  <DropdownMenuItem
                    onClick={() => {
                      handleOpenDeleteDialog(student);
                    }}
                    className="flex items-center gap-2"
                    variant="destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
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
