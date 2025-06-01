'use client';

import { useMemo } from 'react';
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SubmissionType, TargetStatus } from '@prisma/client';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { useDataTableState } from '@/lib/hooks/use-data-table';

interface TargetHistory {
  id: string;
  studentId: string;
  teacherId: string;
  type: SubmissionType;
  description: string | null;
  startDate: Date;
  endDate: Date;
  status: TargetStatus;
  progressPercent: number;
  surahStartId: number | null;
  surahEndId: number | null;
  startAyat: number | null;
  endAyat: number | null;
  wafaId: number | null;
  startPage: number | null;
  endPage: number | null;
  surahStart: { id: number; name: string; verseCount: number } | null;
  surahEnd: { id: number; name: string; verseCount: number } | null;
  wafa: { id: number; name: string; pageCount: number | null } | null;
}

interface TargetHistoryTableProps {
  data: TargetHistory[];
  title: string;
}

export function TargetHistoryTable({ data, title }: TargetHistoryTableProps) {
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
  } = useDataTableState<TargetHistory, string>();

  const columns = useMemo<ColumnDef<TargetHistory>[]>(
    () => [
      {
        accessorKey: 'dateRange',
        id: 'Rentang Tanggal',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Rentang Tanggal" />,
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
        id: 'Jenis Setoran',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Jenis Setoran" />,
        cell: ({ row }) => (
          <Badge variant="outline">
            {row.original.type === 'TAHFIDZ' ? 'Tahfidz' : 'Tahsin (Wafa)'}
          </Badge>
        ),
      },
      {
        accessorKey: 'materi',
        id: 'materi',
        header: 'Materi',
        cell: ({ row }) => {
          const t = row.original;
          if (t.type === 'TAHFIDZ') {
            const surahStart = t.surahStart?.name ?? '-';
            const surahEnd = t.surahEnd?.name ?? '-';
            const ayatRange = t.startAyat && t.endAyat ? `(${t.startAyat} – ${t.endAyat})` : '';

            if (surahStart === surahEnd) {
              return (
                <div className="flex flex-col">
                  <span className="font-medium">{surahStart}</span>
                  {ayatRange && <span className="text-sm text-muted-foreground">{ayatRange}</span>}
                </div>
              );
            }

            return (
              <div className="flex flex-col">
                <span className="font-medium">
                  {surahStart} s/d {surahEnd}
                </span>
                {ayatRange && <span className="text-sm text-muted-foreground">{ayatRange}</span>}
              </div>
            );
          } else {
            const nama = t.wafa?.name ?? '-';
            const halamanRange =
              t.startPage && t.endPage ? `Hal. ${t.startPage} – ${t.endPage}` : '';
            return (
              <div className="flex flex-col">
                <span className="font-medium">{nama}</span>
                {halamanRange && (
                  <span className="text-sm text-muted-foreground">{halamanRange}</span>
                )}
              </div>
            );
          }
        },
      },
      {
        accessorKey: 'progressPercent',
        id: 'Perkembangan',
        header: 'Perkembangan',
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
    ],
    []
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

  return <DataTable title={title} table={table} />;
}
