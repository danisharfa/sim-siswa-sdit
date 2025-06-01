'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';
import { RequestStatusAlertDialog } from './RequestStatusAlertDialog';
import { useDataTableState } from '@/lib/hooks/use-data-table';
import { DataTable } from '@/components/ui/data-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Semester, MunaqasyahRequestStatus, MunaqasyahStage } from '@prisma/client';

interface MunaqasyahRequest {
  id: string;
  stage: MunaqasyahStage;
  status: MunaqasyahRequestStatus;
  createdAt: string;
  student: {
    nis: string;
    user: { fullName: string };
  };
  teacher: {
    user: { fullName: string };
  };
  group: {
    name: string;
    classroom: {
      name: string;
      academicYear: string;
      semester: Semester;
    };
  };
  juz: { name: string };
}

interface MunaqasyahRequestTableProps {
  data: MunaqasyahRequest[];
  title: string;
  onRefresh: () => void;
}

export function MunaqasyahRequestTable({ data, title, onRefresh }: MunaqasyahRequestTableProps) {
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
    selectedItem: selectedRequest,
    setSelectedItem: setSelectedRequest,
    dialogType,
    setDialogType,
  } = useDataTableState<MunaqasyahRequest, 'accept' | 'reject'>();

  const [selectedYearSemester, setSelectedYearSemester] = useState<string | 'ALL'>('ALL');
  const [selectedGroup, setSelectedGroup] = useState<string | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<MunaqasyahRequestStatus | 'ALL'>('ALL');

  const yearSemesterOptions = useMemo(() => {
    const set = new Set<string>();
    for (const d of data) {
      set.add(`${d.group.classroom.academicYear}__${d.group.classroom.semester}`);
    }
    return Array.from(set);
  }, [data]);

  const groupOptions = useMemo(() => {
    if (selectedYearSemester === 'ALL') return [];
    return data
      .filter(
        (d) =>
          `${d.group.classroom.academicYear}__${d.group.classroom.semester}` ===
          selectedYearSemester
      )
      .map((d) => `${d.group.name} - ${d.group.classroom.name}`);
  }, [data, selectedYearSemester]);

  const handleOpenAcceptDialog = useCallback(
    (req: MunaqasyahRequest) => {
      setSelectedRequest(req);
      setDialogType('accept');
    },
    [setSelectedRequest, setDialogType]
  );

  const handleOpenRejectDialog = useCallback(
    (req: MunaqasyahRequest) => {
      setSelectedRequest(req);
      setDialogType('reject');
    },
    [setSelectedRequest, setDialogType]
  );

  const columns = useMemo<ColumnDef<MunaqasyahRequest>[]>(
    () => [
      {
        accessorKey: 'createdAt',
        id: 'Tanggal',
        header: 'Tanggal',
        cell: ({ row }) =>
          new Date(row.original.createdAt).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
      },
      {
        id: 'Siswa',
        header: 'Siswa',
        accessorFn: (row) => row.student.user.fullName,
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">{row.original.student.user.fullName}</div>
            <div className="text-muted-foreground">{row.original.student.nis}</div>
          </div>
        ),
      },
      {
        id: 'Kelompok',
        header: 'Kelompok',
        accessorFn: (row) => `${row.group.name} - ${row.group.classroom.name}`,
      },
      {
        id: 'Tahun Ajaran',
        header: 'Tahun Ajaran',
        accessorFn: (row) => `${row.group.classroom.academicYear} ${row.group.classroom.semester}`,
      },
      {
        accessorKey: 'teacher.user.fullName',
        id: 'Guru Pembimbing',
        header: 'Guru Pembimbing',
        cell: ({ row }) => (
          <Badge variant="secondary" className="w-fit">
            {row.original.teacher.user.fullName}
          </Badge>
        ),
      },
      {
        accessorKey: 'juz.name',
        id: 'Juz',
        header: 'Juz',
        cell: ({ row }) =>
          row.original.juz?.name ? (
            <Badge variant="outline">{row.original.juz.name}</Badge>
          ) : (
            <span>-</span>
          ),
      },
      {
        accessorKey: 'stage',
        id: 'Tahap',
        header: 'Tahap',
        cell: ({ row }) => row.original.stage.replace('_', ' '),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={
              row.original.status === 'DITERIMA'
                ? 'text-green-500 border-green-500'
                : row.original.status === 'DITOLAK'
                ? 'text-red-500 border-red-500'
                : 'text-yellow-500 border-yellow-500'
            }
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => {
          const req = row.original;
          if (req.status !== 'MENUNGGU') return null;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex size-8 p-0">
                  <MoreVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32 z-50">
                <DropdownMenuItem onClick={() => handleOpenAcceptDialog(req)}>
                  Terima
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleOpenRejectDialog(req)}>
                  Tolak
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [handleOpenAcceptDialog, handleOpenRejectDialog]
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
      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <Label className="mb-2 block">Filter Tahun Ajaran</Label>
          <Select
            value={selectedYearSemester}
            onValueChange={(value) => {
              setSelectedYearSemester(value);
              table
                .getColumn('Tahun Ajaran')
                ?.setFilterValue(value === 'ALL' ? undefined : value.replace('__', ' '));
              setSelectedGroup('ALL');
              table.getColumn('Kelompok')?.setFilterValue(undefined);
            }}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Pilih Tahun Ajaran" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua</SelectItem>
              {yearSemesterOptions.map((val) => {
                const [year, sem] = val.split('__');
                return (
                  <SelectItem key={val} value={val}>
                    {year} {sem}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block">Filter Kelompok</Label>
          <Select
            value={selectedGroup}
            disabled={selectedYearSemester === 'ALL'}
            onValueChange={(value) => {
              setSelectedGroup(value);
              table.getColumn('Kelompok')?.setFilterValue(value === 'ALL' ? undefined : value);
            }}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Pilih Kelompok" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua</SelectItem>
              {Array.from(new Set(groupOptions)).map((val) => (
                <SelectItem key={val} value={val}>
                  {val}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block">Filter Status</Label>
          <Select
            value={selectedStatus}
            onValueChange={(value) => {
              setSelectedStatus(value as typeof selectedStatus);
              table.getColumn('status')?.setFilterValue(value === 'ALL' ? undefined : value);
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Pilih Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua</SelectItem>
              <SelectItem value="MENUNGGU">Menunggu</SelectItem>
              <SelectItem value="DITERIMA">Diterima</SelectItem>
              <SelectItem value="DITOLAK">Ditolak</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable title={title} table={table} filterColumn="Siswa" />

      {dialogType === 'accept' && selectedRequest && (
        <RequestStatusAlertDialog
          request={selectedRequest}
          type="accept"
          open={true}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setDialogType(null);
              setSelectedRequest(null);
            }
          }}
          onSave={() => {
            onRefresh();
            setDialogType(null);
            setSelectedRequest(null);
          }}
        />
      )}
      {dialogType === 'reject' && selectedRequest && (
        <RequestStatusAlertDialog
          request={selectedRequest}
          type="reject"
          open={true}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setDialogType(null);
              setSelectedRequest(null);
            }
          }}
          onSave={() => {
            onRefresh();
            setDialogType(null);
            setSelectedRequest(null);
          }}
        />
      )}
    </>
  );
}
