'use client';

import { useCallback, useMemo } from 'react';
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useDataTableState } from '@/lib/hooks/use-data-table';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { DataTable } from '@/components/ui/data-table';
import { TargetAlertDialog } from './alert-dialog';
import { TargetEditDialog } from './edit-dialog';
import { SubmissionType, Semester } from '@prisma/client';

interface Target {
  id: string;
  studentId: string;
  academicYear: string;
  semester: Semester;
  type: SubmissionType;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  progressPercent: number;
  surahStartId?: number;
  surahEndId?: number;
  startAyat?: number;
  endAyat?: number;
  wafaId?: number;
  startPage?: number;
  endPage?: number;
  surahStart?: { name: string };
  surahEnd?: { name: string };
  wafa?: { name: string };
}

interface TargetTableProps {
  data: Target[];
  title: string;
  onRefresh: () => void;
}

export function TargetTable({ data, title, onRefresh }: TargetTableProps) {
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
    selectedItem: selectedTarget,
    setSelectedItem: setSelectedTarget,
    dialogType,
    setDialogType,
  } = useDataTableState<Target, 'edit' | 'delete'>();

  const handleOpenEditDialog = useCallback(
    (target: Target) => {
      setSelectedTarget(target);
      setDialogType('edit');
    },
    [setSelectedTarget, setDialogType]
  );

  const handleOpenDeleteDialog = useCallback(
    (target: Target) => {
      setSelectedTarget(target);
      setDialogType('delete');
    },
    [setSelectedTarget, setDialogType]
  );

  const columns = useMemo<ColumnDef<Target>[]>(
    () => [
      {
        id: 'dateRange',
        header: 'Rentang Tanggal',
        cell: ({ row }) => {
          const start = new Date(row.original.startDate).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });
          const end = new Date(row.original.endDate).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });
          return `${start} – ${end}`;
        },
      },
      {
        accessorKey: 'type',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Jenis" />,
        cell: ({ row }) => (
          <Badge variant="outline">
            {row.original.type === 'TAHFIDZ' ? 'Tahfidz' : 'Tahsin (Wafa)'}
          </Badge>
        ),
      },
      {
        id: 'materi',
        header: 'Materi',
        cell: ({ row }) => {
          const t = row.original;
          if (t.type === 'TAHFIDZ') {
            const surahStart = t.surahStart?.name ?? '-';
            const surahEnd = t.surahEnd?.name ?? '-';
            const ayat = t.startAyat && t.endAyat ? `(${t.startAyat} – ${t.endAyat})` : '';
            return `${surahStart} s/d ${surahEnd} ${ayat}`.trim();
          } else {
            const nama = t.wafa?.name ?? '-';
            const halaman = t.startPage && t.endPage ? `(${t.startPage} – ${t.endPage})` : '';
            return `${nama} ${halaman}`.trim();
          }
        },
      },
      {
        id: 'progress',
        header: 'Progress',
        cell: ({ row }) => {
          const progress = row.original.progressPercent ?? 0;
          return (
            <div className="flex flex-col gap-1 w-[120px]">
              <span className="text-xs text-right text-muted-foreground">{progress}%</span>
              <Progress value={progress} />
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status;
          const color = {
            TERCAPAI: 'green',
            TIDAK_TERCAPAI: 'red',
          }[status];
          return (
            <Badge variant="outline" className={`border-${color}-500 text-${color}-700`}>
              {status}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'description',
        header: 'Deskripsi',
      },
      {
        id: 'actions',
        enableHiding: false,
        header: 'Aksi',
        cell: ({ row }) => {
          const user = row.original;
          return (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex size-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Target Option</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-50 z-50">
                  <DropdownMenuItem
                    onClick={() => handleOpenEditDialog(user)}
                    className="flex items-center gap-2"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleOpenDeleteDialog(user)}
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
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
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
  });

  return (
    <>
      <DataTable title={title} table={table} />

      {dialogType === 'edit' && selectedTarget && (
        <TargetEditDialog
          target={selectedTarget}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedTarget(null);
              setDialogType(null);
            }
          }}
          onSave={() => {
            onRefresh();
            setSelectedTarget(null);
            setDialogType(null);
          }}
        />
      )}
      {dialogType === 'delete' && selectedTarget && (
        <TargetAlertDialog
          target={selectedTarget}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedTarget(null);
              setDialogType(null);
            }
          }}
          onConfirm={() => {
            onRefresh();
            setSelectedTarget(null);
            setDialogType(null);
          }}
        />
      )}
    </>
  );
}
