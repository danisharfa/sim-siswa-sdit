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
import { Semester, TashihRequestStatus, TashihType } from '@prisma/client';

interface TashihRequest {
  id: string;
  createdAt: string;
  tashihType?: TashihType;
  status: TashihRequestStatus;
  startPage?: number;
  endPage?: number;
  notes?: string;
  juz?: { name: string };
  surah?: { name: string };
  wafa?: { name: string };
  teacher: { user: { fullName: string } };
  student: {
    nis: string;
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
}

interface TashihRequestTableProps {
  data: TashihRequest[];
  title: string;
  onRefresh: () => void;
}

export function TashihRequestTable({ data, title, onRefresh }: TashihRequestTableProps) {
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
  } = useDataTableState<TashihRequest, 'accept' | 'reject'>();

  const [selectedYearSemester, setSelectedYearSemester] = useState<string | 'ALL'>('ALL');
  const [selectedGroup, setSelectedGroup] = useState<string | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<TashihRequestStatus | 'ALL'>('ALL');

  const yearSemesterOptions = useMemo(() => {
    const set = new Set<string>();
    for (const d of data) {
      if (d.group.classroom.academicYear && d.group.classroom.semester) {
        set.add(`${d.group.classroom.academicYear}__${d.group.classroom.semester}`);
      }
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
    (request: TashihRequest) => {
      setSelectedRequest(request);
      setDialogType('accept');
    },
    [setDialogType, setSelectedRequest]
  );

  const handleOpenRejectDialog = useCallback(
    (request: TashihRequest) => {
      setSelectedRequest(request);
      setDialogType('reject');
    },
    [setDialogType, setSelectedRequest]
  );

  const columns = useMemo<ColumnDef<TashihRequest>[]>(() => {
    const cols: ColumnDef<TashihRequest>[] = [
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
        accessorFn: (row) =>
          row.group.name && row.group.classroom.name
            ? `${row.group.name} - ${row.group.classroom.name}`
            : 'Tidak terdaftar',
      },
      {
        id: 'Tahun Ajaran',
        header: 'Tahun Ajaran',
        accessorFn: (row) =>
          row.group.classroom.academicYear && row.group.classroom.semester
            ? `${row.group.classroom.academicYear} ${row.group.classroom.semester}`
            : 'Tidak terdaftar',
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
        accessorKey: 'tashihType',
        id: 'Jenis Tashih',
        header: 'Jenis Tashih',
        cell: ({ row }) => (
          <Badge variant="outline" className="w-fit">
            {row.original.tashihType === TashihType.ALQURAN ? "Al-Qur'an" : 'Wafa'}
          </Badge>
        ),
        enableColumnFilter: true,
      },
      {
        accessorKey: 'tashihType',
        id: 'Materi',
        header: 'Materi',
        cell: ({ row }) => {
          const { tashihType, surah, juz, wafa, startPage, endPage } = row.original;
          if (tashihType === TashihType.ALQURAN) {
            return <Badge variant="outline">{`${surah?.name ?? '-'} (${juz?.name ?? '-'})`}</Badge>;
          }
          if (tashihType === TashihType.WAFA) {
            const label =
              startPage && endPage
                ? startPage === endPage
                  ? `Hal ${startPage}`
                  : `Hal ${startPage}-${endPage}`
                : '-';
            return <Badge variant="outline">{`${wafa?.name ?? '-'} (${label})`}</Badge>;
          }
          return <Badge variant="outline">-</Badge>;
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={
              row.original.status === TashihRequestStatus.DITERIMA
                ? 'text-green-500 border-green-500'
                : row.original.status === TashihRequestStatus.DITOLAK
                ? 'text-red-500 border-red-500'
                : row.original.status === TashihRequestStatus.SELESAI
                ? 'text-blue-500 border-blue-500'
                : 'text-yellow-500 border-yellow-500'
            }
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: 'notes',
        id: 'Catatan',
        header: 'Catatan',
        cell: ({ row }) => row.original.notes || '-',
      },
    ];

    cols.push({
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => {
        const request = row.original;
        if (request.status !== 'MENUNGGU') return null;

        return (
          <div className="flex gap-2">
            <Button variant="default" size="sm" onClick={() => handleOpenAcceptDialog(request)}>
              Terima
            </Button>
            <Button variant="destructive" size="sm" onClick={() => handleOpenRejectDialog(request)}>
              Tolak
            </Button>
          </div>
        );
      },
    });

    return cols;
  }, [handleOpenAcceptDialog, handleOpenRejectDialog]);

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
          <Label className="mb-2 block">Filter Tahun Akademik</Label>
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
              <SelectValue placeholder="Pilih Tahun Ajaran & Semester" />
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
          <Label className="mb-2 block">Filter Jenis Tashih</Label>
          <Select
            onValueChange={(value) => {
              table.getColumn('tashihType')?.setFilterValue(value === 'ALL' ? undefined : value);
            }}
            defaultValue="ALL"
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Pilih Jenis Tashih" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua</SelectItem>
              <SelectItem value={TashihType.ALQURAN}>Al-Qur&apos;an</SelectItem>
              <SelectItem value={TashihType.WAFA}>Wafa</SelectItem>
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
              <SelectValue placeholder="Pilih Status Permintaan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua</SelectItem>
              <SelectItem value="MENUNGGU">Menunggu</SelectItem>
              <SelectItem value={TashihRequestStatus.DITERIMA}>Diterima</SelectItem>
              <SelectItem value={TashihRequestStatus.DITOLAK}>Ditolak</SelectItem>
              <SelectItem value={TashihRequestStatus.SELESAI}>Selesai</SelectItem>
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
