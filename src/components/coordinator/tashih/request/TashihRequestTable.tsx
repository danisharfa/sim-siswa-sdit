'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
import useSWR from 'swr';
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
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { ExportToPDFButton } from './ExportToPDFButton';

export type TashihRequest = {
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
};

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

  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [selectedTashihType, setSelectedTashihType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const { data: academicSetting } = useSWR('/api/academicSetting', (url: string) =>
    fetch(url).then((res) => res.json())
  );

  const defaultPeriod = academicSetting
    ? `${academicSetting.currentYear}-${academicSetting.currentSemester}`
    : '';

  const academicPeriods = useMemo(() => {
    const set = new Set<string>();
    for (const request of data) {
      const r = request;
      set.add(`${r.group.classroom.academicYear}-${r.group.classroom.semester}`);
    }
    return Array.from(set);
  }, [data]);

  const filteredByPeriod = useMemo(() => {
    if (!selectedPeriod) return data;
    const [year, semester] = selectedPeriod.split('-');
    return data.filter(
      (request) =>
        request.group.classroom.academicYear === year &&
        request.group.classroom.semester === semester
    );
  }, [data, selectedPeriod]);

  const availableGroups = useMemo(() => {
    const groupMap = new Map<string, { id: string; name: string; classroom: { name: string } }>();
    filteredByPeriod.forEach((request) => {
      const r = request;
      const groupKey = `${r.group.name}-${r.group.classroom.name}`;
      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, {
          id: groupKey,
          name: r.group.name,
          classroom: { name: r.group.classroom.name },
        });
      }
    });
    return Array.from(groupMap.values());
  }, [filteredByPeriod]);

  const availableStudents = useMemo(() => {
    if (selectedGroupId === 'all') return [];
    const students = new Set<string>();
    filteredByPeriod.forEach((request) => {
      const r = request;
      const groupKey = `${r.group.name}-${r.group.classroom.name}`;
      if (groupKey === selectedGroupId) {
        students.add(r.student.user.fullName);
      }
    });
    return Array.from(students).sort();
  }, [filteredByPeriod, selectedGroupId]);

  const availableTashihTypes = useMemo(() => {
    const types = new Set<TashihType>();
    filteredByPeriod.forEach((request) => {
      if (request.tashihType) {
        types.add(request.tashihType);
      }
    });
    return Array.from(types);
  }, [filteredByPeriod]);

  const availableStatuses = useMemo(() => {
    const statuses = new Set<TashihRequestStatus>();
    filteredByPeriod.forEach((request) => {
      statuses.add(request.status);
    });
    return Array.from(statuses);
  }, [filteredByPeriod]);

  useEffect(() => {
    if (defaultPeriod && !selectedPeriod && academicPeriods.length > 0) {
      const targetPeriod = academicPeriods.includes(defaultPeriod)
        ? defaultPeriod
        : academicPeriods[0];
      setSelectedPeriod(targetPeriod);
    }
  }, [defaultPeriod, academicPeriods, selectedPeriod]);

  const academicYearForExport = useMemo(() => {
    if (!selectedPeriod) return '';
    const [year, semester] = selectedPeriod.split('-');
    return `${year} ${semester}`;
  }, [selectedPeriod]);

  // ===== EVENT HANDLERS =====
  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
    setSelectedGroupId('all');
    setSelectedStudent('all');
    setSelectedTashihType('all');
    setSelectedStatus('all');
    // Clear table filters
    table.getColumn('Kelompok')?.setFilterValue(undefined);
    table.getColumn('Siswa')?.setFilterValue(undefined);
    table.getColumn('Jenis Tashih')?.setFilterValue(undefined);
    table.getColumn('status')?.setFilterValue(undefined);
  };

  const handleGroupChange = (value: string) => {
    setSelectedGroupId(value);
    setSelectedStudent('all');

    if (value === 'all') {
      table.getColumn('Kelompok')?.setFilterValue(undefined);
    } else {
      const group = availableGroups.find((g) => g.id === value);
      if (group) {
        table.getColumn('Kelompok')?.setFilterValue(`${group.name} - ${group.classroom.name}`);
      }
    }
    table.getColumn('Siswa')?.setFilterValue(undefined);
  };

  const handleStudentChange = (value: string) => {
    setSelectedStudent(value);
    table.getColumn('Siswa')?.setFilterValue(value === 'all' ? undefined : value);
  };

  const handleTashihTypeChange = (value: string) => {
    setSelectedTashihType(value);
    table.getColumn('Jenis Tashih')?.setFilterValue(value === 'all' ? undefined : value);
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    table.getColumn('status')?.setFilterValue(value === 'all' ? undefined : value);
  };

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
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
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
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">{row.original.group.name}</div>
            <div className="text-muted-foreground">{row.original.group.classroom.name}</div>
          </div>
        ),
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
        filterFn: (row) => {
          if (selectedTashihType === 'all') return true;
          return row.original.tashihType === selectedTashihType;
        },
        cell: ({ row }) => (
          <Badge variant="outline" className="w-fit">
            {row.original.tashihType === TashihType.ALQURAN ? "Al-Qur'an" : 'Wafa'}
          </Badge>
        ),
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
        filterFn: (row) => {
          if (selectedStatus === 'all') return true;
          return row.original.status === selectedStatus;
        },
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
  }, [handleOpenAcceptDialog, handleOpenRejectDialog, selectedTashihType, selectedStatus]);

  const table = useReactTable({
    data: filteredByPeriod,
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
          <Label className="mb-2 block sr-only">Filter Tahun Akademik</Label>
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="min-w-[200px]">
              <SelectValue placeholder="Pilih Tahun Akademik" />
            </SelectTrigger>
            <SelectContent>
              {academicPeriods.map((period) => {
                const [year, semester] = period.split('-');
                return (
                  <SelectItem key={period} value={period}>
                    {year} {semester}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block sr-only">Filter Kelompok</Label>
          <Select value={selectedGroupId} onValueChange={handleGroupChange}>
            <SelectTrigger className="min-w-[200px]">
              <SelectValue placeholder="Pilih Kelompok" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kelompok</SelectItem>
              {availableGroups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name} - {group.classroom.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block sr-only">Filter Siswa</Label>
          <Select
            disabled={selectedGroupId === 'all'}
            value={selectedStudent}
            onValueChange={handleStudentChange}
          >
            <SelectTrigger className="min-w-[200px]">
              <SelectValue placeholder="Pilih Siswa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Siswa</SelectItem>
              {availableStudents.map((student) => (
                <SelectItem key={student} value={student}>
                  {student}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block sr-only">Filter Jenis Tashih</Label>
          <Select value={selectedTashihType} onValueChange={handleTashihTypeChange}>
            <SelectTrigger className="min-w-[180px]">
              <SelectValue placeholder="Pilih Jenis Tashih" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Jenis Tashih</SelectItem>
              {availableTashihTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type === TashihType.ALQURAN ? "Al-Qur'an" : 'Wafa'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block sr-only">Filter Status</Label>
          <Select value={selectedStatus} onValueChange={handleStatusChange}>
            <SelectTrigger className="min-w-[150px]">
              <SelectValue placeholder="Pilih Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {availableStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ExportToPDFButton table={table} academicYear={academicYearForExport} />
      </div>

      <DataTable title={title} table={table} showColumnFilter={false} />

      {selectedPeriod && filteredByPeriod.length === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center mt-4">
          <p className="text-muted-foreground">
            Tidak ada permintaan tashih untuk Tahun Akademik {selectedPeriod.replace('-', ' ')}.
          </p>
        </div>
      )}

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
