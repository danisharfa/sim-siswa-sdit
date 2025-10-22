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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrendingUp, TrendingDown, Clock, Trash2, Pencil } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { SubmissionType, TargetStatus, Semester } from '@prisma/client';
import { useDataTableState } from '@/lib/hooks/use-data-table';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { DataTable } from '@/components/ui/data-table';
import { ExportToPDFButton } from './ExportToPDFButton';
import { TargetEditDialog } from './TargetEditDialog';
import { TargetAlertDialog } from './TargetAlertDialog';

export type WeeklyTarget = {
  id: string;
  type: SubmissionType;
  startDate: string;
  endDate: string;
  description: string;
  status: TargetStatus;
  progressPercent: number;
  createdAt: string;
  student: {
    userId: string;
    nis: string;
    user: {
      fullName: string;
    };
  };
  group: {
    id: string;
    name: string;
    classroom: {
      name: string;
      academicYear: string;
      semester: Semester;
    };
  };
  surahStart?: {
    id: number;
    name: string;
  };
  surahEnd?: {
    id: number;
    name: string;
  };
  wafa?: {
    id: number;
    name: string;
  };
  startAyat?: number;
  endAyat?: number;
  startPage?: number;
  endPage?: number;
};

interface Props {
  data: WeeklyTarget[];
  title: string;
  onRefresh: () => void;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const statusConfig = {
  TERCAPAI: { label: 'Tercapai', variant: 'default' as const, color: 'text-green-600' },
  TIDAK_TERCAPAI: {
    label: 'Tidak Tercapai',
    variant: 'destructive' as const,
    color: 'text-red-600',
  },
};

export function TargetTable({ data, title, onRefresh }: Props) {
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
  } = useDataTableState<WeeklyTarget, 'edit' | 'delete'>();

  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedTargetType, setSelectedTargetType] = useState('all');
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedTargetPeriod, setSelectedTargetPeriod] = useState('all');

  const { data: academicSetting } = useSWR('/api/academicSetting', fetcher);

  const defaultPeriod = academicSetting
    ? `${academicSetting.currentYear}-${academicSetting.currentSemester}`
    : '';

  const academicPeriods = useMemo(
    () =>
      Array.from(
        new Set(data.map((d) => `${d.group.classroom.academicYear}-${d.group.classroom.semester}`))
      ),
    [data]
  );

  const filteredByPeriod = useMemo(() => {
    if (!selectedPeriod) return data;
    const [year, semester] = selectedPeriod.split('-');
    return data.filter(
      (target) =>
        target.group.classroom.academicYear === year && target.group.classroom.semester === semester
    );
  }, [data, selectedPeriod]);

  const availableGroups = useMemo(() => {
    const groupMap = new Map<string, WeeklyTarget['group']>();
    filteredByPeriod.forEach((target) => {
      if (!groupMap.has(target.group.id)) {
        groupMap.set(target.group.id, target.group);
      }
    });
    return Array.from(groupMap.values());
  }, [filteredByPeriod]);

  const availableStudents = useMemo(() => {
    if (selectedGroupId === 'all') return [];
    return Array.from(
      new Set(
        filteredByPeriod
          .filter((target) => target.group.id === selectedGroupId)
          .map((target) => target.student.user.fullName)
      )
    );
  }, [filteredByPeriod, selectedGroupId]);

  const availableTargetTypes = useMemo(
    () => Array.from(new Set(filteredByPeriod.map((target) => target.type))),
    [filteredByPeriod]
  );

  const availableStatuses = useMemo(
    () => Array.from(new Set(filteredByPeriod.map((target) => target.status))),
    [filteredByPeriod]
  );

  const availableTargetPeriods = useMemo(() => {
    const periods = new Set<string>();
    filteredByPeriod.forEach((target) => {
      const periodKey = `${target.startDate}|${target.endDate}`;
      periods.add(periodKey);
    });
    return Array.from(periods).map((period) => {
      const [startDate, endDate] = period.split('|');
      return { startDate, endDate, key: period };
    });
  }, [filteredByPeriod]);

  useEffect(() => {
    if (defaultPeriod && !selectedPeriod && academicPeriods.length > 0) {
      const targetPeriod = academicPeriods.includes(defaultPeriod)
        ? defaultPeriod
        : academicPeriods[0];
      setSelectedPeriod(targetPeriod);
    }
  }, [defaultPeriod, academicPeriods, selectedPeriod]);

  // ===== EVENT HANDLERS =====
  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
    setSelectedGroupId('all');
    setSelectedStudent('all');
    setSelectedStatus('all');
    setSelectedTargetType('all');
    setSelectedTargetPeriod('all');
    // Clear table filters
    table.getColumn('Kelompok')?.setFilterValue(undefined);
    table.getColumn('Siswa')?.setFilterValue(undefined);
    table.getColumn('Status')?.setFilterValue(undefined);
    table.getColumn('Jenis Target')?.setFilterValue(undefined);
    table.getColumn('Periode Target')?.setFilterValue(undefined);
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

  const handleTargetTypeChange = (value: string) => {
    setSelectedTargetType(value);
    table.getColumn('Jenis Target')?.setFilterValue(value === 'all' ? undefined : value);
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    table.getColumn('Status')?.setFilterValue(value === 'all' ? undefined : value);
  };

  const handleTargetPeriodChange = (value: string) => {
    setSelectedTargetPeriod(value);
    table.getColumn('Periode Target')?.setFilterValue(value === 'all' ? undefined : value);
  };

  const handleOpenEditDialog = useCallback(
    (target: WeeklyTarget) => {
      setSelectedTarget(target);
      setDialogType('edit');
    },
    [setSelectedTarget, setDialogType]
  );

  const handleOpenDeleteDialog = useCallback(
    (target: WeeklyTarget) => {
      setSelectedTarget(target);
      setDialogType('delete');
    },
    [setSelectedTarget, setDialogType]
  );

  const getTargetDetail = useCallback((target: WeeklyTarget) => {
    if (target.type === SubmissionType.TAHSIN_WAFA) {
      return `${target.wafa?.name || ''} Hal. ${target.startPage}-${target.endPage}`;
    } else {
      return `${target.surahStart?.name || ''} ${target.startAyat ? `(${target.startAyat}` : ''}${
        target.endAyat ? `-${target.endAyat})` : ''
      }${
        target.surahEnd && target.surahEnd.name !== target.surahStart?.name
          ? ` - ${target.surahEnd.name}`
          : ''
      }`;
    }
  }, []);

  const getStatusIcon = useCallback((status: TargetStatus) => {
    if (status === 'TERCAPAI') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (status === 'TIDAK_TERCAPAI') return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Clock className="w-4 h-4 text-blue-600" />;
  }, []);

  const columns = useMemo<ColumnDef<WeeklyTarget>[]>(
    () => [
      {
        id: 'Periode Target',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Periode Target" />,
        accessorFn: (row) => `${row.startDate} - ${row.endDate}`,
        filterFn: (row, columnId, value) => {
          if (!value || value === 'all') return true;
          const rowPeriod = `${row.original.startDate}|${row.original.endDate}`;
          return rowPeriod === value;
        },
        cell: ({ row }) => (
          <div className="text-sm">
            <div>
              {new Date(row.original.startDate).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </div>
            <div className="text-muted-foreground">
              -{' '}
              {new Date(row.original.endDate).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </div>
          </div>
        ),
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
        accessorKey: 'type',
        id: 'Jenis Target',
        header: 'Jenis Target',
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.type.replaceAll('_', ' ')}</Badge>
        ),
      },
      {
        accessorKey: 'surahStart',
        id: 'Detail Target',
        header: 'Detail Target',
        cell: ({ row }) => (
          <div className="max-w-xs">
            <div className="font-medium">{getTargetDetail(row.original)}</div>
            {row.original.description && (
              <div className="text-sm text-muted-foreground truncate">
                {row.original.description}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'progressPercent',
        id: 'Progress',
        header: 'Progress',
        cell: ({ row }) => (
          <div className="space-y-1">
            <Progress value={row.original.progressPercent || 0} className="w-20" />
            <div className="text-xs text-center">{row.original.progressPercent || 0}%</div>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        id: 'Status',
        header: 'Status',
        filterFn: (row, columnId, value) => {
          if (!value || value === 'all') return true;
          const status = row.getValue(columnId);
          return status === value;
        },
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <div className="flex items-center gap-2">
              {getStatusIcon(status)}
              <Badge variant={statusConfig[status].variant}>{statusConfig[status].label}</Badge>
            </div>
          );
        },
      },
      {
        id: 'actions',
        enableHiding: false,
        header: 'Aksi',
        cell: ({ row }) => {
          const target = row.original;
          return (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => handleOpenEditDialog(target)}>
                <Pencil />
                Edit
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleOpenDeleteDialog(target)}
              >
                <Trash2 />
                Delete
              </Button>
            </div>
          );
        },
      },
    ],
    [handleOpenEditDialog, handleOpenDeleteDialog, getTargetDetail, getStatusIcon]
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
      <div className="flex flex-wrap gap-4 items-end">
        <Label className="mb-2 block sr-only">Filter Tahun Akademik</Label>
        <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
          <SelectTrigger className="min-w-[200px]">
            <SelectValue placeholder="Pilih Tahun Akademik" />
          </SelectTrigger>
          <SelectContent>
            {academicPeriods.map((period) => (
              <SelectItem key={period} value={period}>
                {period.replace('-', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedGroupId} onValueChange={handleGroupChange}>
          <Label className="mb-2 block sr-only">Filter Kelompok</Label>
          <SelectTrigger className="min-w-[200px]">
            <SelectValue placeholder="Pilih Kelompok" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kelompok</SelectItem>
            {availableGroups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {`${group.name} - ${group.classroom.name}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          disabled={selectedGroupId === 'all'}
          value={selectedStudent}
          onValueChange={handleStudentChange}
        >
          <Label className="mb-2 block sr-only">Filter Siswa</Label>
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

        <Select value={selectedTargetType} onValueChange={handleTargetTypeChange}>
          <Label className="mb-2 block sr-only">Filter Jenis Target</Label>
          <SelectTrigger className="min-w-[200px]">
            <SelectValue placeholder="Pilih Jenis Target" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Jenis Target</SelectItem>
            {availableTargetTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type.replaceAll('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={handleStatusChange}>
          <Label className="mb-2 block sr-only">Filter Status</Label>
          <SelectTrigger className="min-w-[180px]">
            <SelectValue placeholder="Pilih Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            {availableStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {statusConfig[status].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedTargetPeriod} onValueChange={handleTargetPeriodChange}>
          <Label className="mb-2 block sr-only">Filter Periode Target</Label>
          <SelectTrigger className="min-w-[200px]">
            <SelectValue placeholder="Pilih Periode Target" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Periode Target</SelectItem>
            {availableTargetPeriods.map((period) => (
              <SelectItem key={period.key} value={period.key}>
                {new Date(period.startDate).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}{' '}
                -{' '}
                {new Date(period.endDate).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <ExportToPDFButton table={table} />
      </div>

      {/* Card Statistik Target */}
      <Card>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-muted-foreground">Total Target</h4>
              <p className="font-semibold">{filteredByPeriod.length}</p>
            </div>
            <div>
              <h4 className="font-medium text-muted-foreground">Tercapai</h4>
              <p className="font-semibold text-green-600">
                {filteredByPeriod.filter((target) => target.status === 'TERCAPAI').length}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-muted-foreground">Tidak Tercapai</h4>
              <p className="font-semibold text-red-600">
                {filteredByPeriod.filter((target) => target.status === 'TIDAK_TERCAPAI').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <DataTable title={title} table={table} showColumnFilter={false} />

      {dialogType === 'edit' && selectedTarget && (
        <TargetEditDialog
          target={{
            id: selectedTarget.id,
            studentId: selectedTarget.student.userId,
            type: selectedTarget.type,
            description: selectedTarget.description,
            startDate: new Date(selectedTarget.startDate),
            endDate: new Date(selectedTarget.endDate),
            surahStartId: selectedTarget.surahStart?.id,
            surahEndId: selectedTarget.surahEnd?.id,
            startAyat: selectedTarget.startAyat,
            endAyat: selectedTarget.endAyat,
            wafaId: selectedTarget.wafa?.id,
            startPage: selectedTarget.startPage,
            endPage: selectedTarget.endPage,
          }}
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
          target={{ id: selectedTarget.id }}
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
