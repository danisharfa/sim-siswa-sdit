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
import {
  Semester,
  MunaqasyahRequestStatus,
  MunaqasyahStage,
  MunaqasyahBatch,
} from '@prisma/client';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { ExportToPDFButton } from './ExportToPDFButton';

export type MunaqasyahRequest = {
  id: string;
  batch: MunaqasyahBatch;
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
};

const batchLabels: Record<MunaqasyahBatch, string> = {
  [MunaqasyahBatch.TAHAP_1]: 'Tahap 1',
  [MunaqasyahBatch.TAHAP_2]: 'Tahap 2',
  [MunaqasyahBatch.TAHAP_3]: 'Tahap 3',
  [MunaqasyahBatch.TAHAP_4]: 'Tahap 4',
};

const stageLabels: Record<MunaqasyahStage, string> = {
  [MunaqasyahStage.TASMI]: 'Tasmi',
  [MunaqasyahStage.MUNAQASYAH]: 'Munaqasyah',
};

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

  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedJuz, setSelectedJuz] = useState('all');
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

  const availableBatches = useMemo(() => {
    const batches = new Set<MunaqasyahBatch>();
    filteredByPeriod.forEach((request) => {
      batches.add(request.batch);
    });
    return Array.from(batches);
  }, [filteredByPeriod]);

  const availableStages = useMemo(() => {
    const stages = new Set<MunaqasyahStage>();
    filteredByPeriod.forEach((request) => {
      stages.add(request.stage);
    });
    return Array.from(stages);
  }, [filteredByPeriod]);

  const availableJuz = useMemo(() => {
    const juzSet = new Set<string>();
    filteredByPeriod.forEach((request) => {
      juzSet.add(request.juz.name);
    });
    return Array.from(juzSet).sort();
  }, [filteredByPeriod]);

  const availableStatuses = useMemo(() => {
    const statuses = new Set<MunaqasyahRequestStatus>();
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
    setSelectedBatch('all');
    setSelectedStage('all');
    setSelectedJuz('all');
    setSelectedStatus('all');
    // Clear table filters
    table.getColumn('Kelompok')?.setFilterValue(undefined);
    table.getColumn('Siswa')?.setFilterValue(undefined);
    table.getColumn('Batch')?.setFilterValue(undefined);
    table.getColumn('Tahapan')?.setFilterValue(undefined);
    table.getColumn('Juz')?.setFilterValue(undefined);
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

  const handleBatchChange = (value: string) => {
    setSelectedBatch(value);
    table
      .getColumn('Batch')
      ?.setFilterValue(value === 'all' ? undefined : batchLabels[value as MunaqasyahBatch]);
  };

  const handleStageChange = (value: string) => {
    setSelectedStage(value);
    table
      .getColumn('Tahap')
      ?.setFilterValue(value === 'all' ? undefined : stageLabels[value as MunaqasyahStage]);
  };

  const handleJuzChange = (value: string) => {
    setSelectedJuz(value);
    table.getColumn('Juz')?.setFilterValue(value === 'all' ? undefined : value);
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    table.getColumn('status')?.setFilterValue(value === 'all' ? undefined : value);
  };

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
          <div className='font-medium'>{row.original.teacher.user.fullName}</div>
        ),
      },
      {
        id: 'Batch',
        header: 'Batch',
        accessorFn: (row) => batchLabels[row.batch],
        cell: ({ row }) => <div className='font-medium'>{batchLabels[row.original.batch]}</div>,
        filterFn: (row, columnId, filterValue) => {
          const value = row.getValue(columnId) as string;
          return value.includes(filterValue);
        },
      },
      {
        id: 'Tahapan Ujian',
        header: 'Tahapan Ujian',
        accessorFn: (row) => stageLabels[row.stage],
        cell: ({ row }) => <div className='font-medium'>{stageLabels[row.original.stage]}</div>,
        filterFn: (row, columnId, filterValue) => {
          const value = row.getValue(columnId) as string;
          return value.includes(filterValue);
        },
      },
      {
        id: 'Juz',
        header: 'Juz',
        accessorFn: (row) => row.juz.name,
        cell: ({ row }) => <Badge variant="outline">{row.original.juz.name}</Badge>,
        filterFn: (row, columnId, filterValue) => {
          const value = row.getValue(columnId) as string;
          return value === filterValue;
        },
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
                : row.original.status === 'SELESAI'
                ? 'text-blue-500 border-blue-500'
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
          const request = row.original;
          if (request.status !== 'MENUNGGU') return null;
          return (
            <div className="flex gap-2">
              <Button variant="default" size="sm" onClick={() => handleOpenAcceptDialog(request)}>
                Terima
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleOpenRejectDialog(request)}
              >
                Tolak
              </Button>
            </div>
          );
        },
      },
    ],
    [handleOpenAcceptDialog, handleOpenRejectDialog]
  );

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
          <Label className="mb-2 block sr-only">Filter Batch</Label>
          <Select value={selectedBatch} onValueChange={handleBatchChange}>
            <SelectTrigger className="min-w-[200px]">
              <SelectValue placeholder="Pilih Batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Batch</SelectItem>
              {availableBatches.map((batch) => (
                <SelectItem key={batch} value={batch}>
                  {batchLabels[batch]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block sr-only">Filter Tahap</Label>
          <Select value={selectedStage} onValueChange={handleStageChange}>
            <SelectTrigger className="min-w-[200px]">
              <SelectValue placeholder="Pilih Tahap" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tahapan Ujian</SelectItem>
              {availableStages.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {stageLabels[stage]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block sr-only">Filter Juz</Label>
          <Select value={selectedJuz} onValueChange={handleJuzChange}>
            <SelectTrigger className="min-w-[200px]">
              <SelectValue placeholder="Pilih Juz" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Juz</SelectItem>
              {availableJuz.map((juz) => (
                <SelectItem key={juz} value={juz}>
                  {juz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block sr-only">Filter Status</Label>
          <Select value={selectedStatus} onValueChange={handleStatusChange}>
            <SelectTrigger className="min-w-[200px]">
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
            Tidak ada permintaan munaqasyah untuk Tahun Akademik {selectedPeriod.replace('-', ' ')}.
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
