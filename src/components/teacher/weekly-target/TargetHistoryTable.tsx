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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import {
  Target,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Clock,
  MoreVertical,
  Trash2,
  Pencil,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { type DateRange } from 'react-day-picker';
import { SubmissionType, TargetStatus, Semester } from '@prisma/client';
import { TargetEditDialog } from './TargetEditDialog';
import { TargetAlertDialog } from './TargetAlertDialog';
import { useDataTableState } from '@/lib/hooks/use-data-table';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { DataTable } from '@/components/ui/data-table';
import { Calendar23 } from '@/components/calendar/calendar-23';
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

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
    id: string;
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

const typeConfig = {
  TAHFIDZ: { label: 'Tahfidz', icon: Target },
  TAHSIN_WAFA: { label: 'Tahsin Wafa', icon: BookOpen },
  TAHSIN_ALQURAN: { label: 'Tahsin Al-Quran', icon: BookOpen },
};

export function TargetHistoryTable({ data, title, onRefresh }: Props) {
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
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>();

  const { data: setting } = useSWR('/api/academicSetting', fetcher);

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

  const academicPeriods = useMemo(() => {
    return Array.from(
      new Set(data.map((d) => `${d.group.classroom.academicYear}-${d.group.classroom.semester}`))
    );
  }, [data]);

  const defaultPeriod = setting ? `${setting.currentYear}-${setting.currentSemester}` : '';

  useEffect(() => {
    if (defaultPeriod && !selectedPeriod) {
      if (academicPeriods.includes(defaultPeriod)) {
        setSelectedPeriod(defaultPeriod);
      } else if (academicPeriods.length > 0) {
        setSelectedPeriod(academicPeriods[0]);
      }
    }
  }, [defaultPeriod, academicPeriods, selectedPeriod]);

  const filteredData = useMemo(() => {
    if (!selectedPeriod) return data;

    const [academicYear, semester] = selectedPeriod.split('-');
    return data.filter(
      (target) =>
        target.group.classroom.academicYear === academicYear &&
        target.group.classroom.semester === semester
    );
  }, [data, selectedPeriod]);

  const groupList = useMemo(() => {
    const map = new Map<string, WeeklyTarget['group']>();
    for (const d of filteredData) {
      if (!map.has(d.group.id)) {
        map.set(d.group.id, d.group);
      }
    }
    return Array.from(map.values());
  }, [filteredData]);

  const studentByGroup = useMemo(() => {
    if (selectedGroupId === 'all') return [];
    return Array.from(
      new Set(
        filteredData
          .filter((d) => d.group.id === selectedGroupId)
          .map((d) => d.student.user.fullName)
      )
    );
  }, [selectedGroupId, filteredData]);

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
        accessorKey: 'createdAt',
        id: 'Tanggal',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
        filterFn: (row, columnId) => {
          if (!selectedDateRange) return true;

          const date = new Date(row.getValue(columnId));
          const { from, to } = selectedDateRange;

          if (from && to) {
            return date >= from && date <= to;
          } else if (from) {
            return date >= from;
          } else if (to) {
            return date <= to;
          }

          return true;
        },
        cell: ({ row }) => (
          <span>{format(new Date(row.getValue('Tanggal')), 'dd MMM yyyy', { locale: id })}</span>
        ),
      },
      {
        id: 'Periode Target',
        header: 'Periode Target',
        accessorFn: (row) => `${row.startDate} - ${row.endDate}`,
        cell: ({ row }) => (
          <div className="text-sm">
            <div>{format(new Date(row.original.startDate), 'dd MMM', { locale: id })}</div>
            <div className="text-muted-foreground">
              - {format(new Date(row.original.endDate), 'dd MMM yyyy', { locale: id })}
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
          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
            {React.createElement(typeConfig[row.original.type].icon, {
              className: 'w-3 h-3',
            })}
            {typeConfig[row.original.type].label}
          </Badge>
        ),
      },
      {
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Menu aksi</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleOpenEditDialog(target)}
                  className="flex items-center gap-2"
                >
                  <Pencil />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleOpenDeleteDialog(target)}
                  className="flex items-center gap-2"
                  variant="destructive"
                >
                  <Trash2 />
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [
      selectedDateRange,
      handleOpenEditDialog,
      handleOpenDeleteDialog,
      getTargetDetail,
      getStatusIcon,
    ]
  );

  const table = useReactTable({
    data: filteredData,
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
        <div>
          <Label className="mb-2 block">Filter Tahun Akademik</Label>
          <Select
            value={selectedPeriod}
            onValueChange={(val) => {
              setSelectedPeriod(val);
              setSelectedGroupId('all');
              setSelectedStudent('all');
            }}
          >
            <SelectTrigger className="min-w-0 w-full sm:min-w-[220px]">
              <SelectValue placeholder="Pilih Tahun Akademik" />
            </SelectTrigger>
            <SelectContent>
              {academicPeriods.map((p) => (
                <SelectItem key={p} value={p}>
                  {p.replace('-', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block">Filter Kelompok</Label>
          <Select
            value={selectedGroupId}
            onValueChange={(val) => {
              setSelectedGroupId(val);
              setSelectedStudent('all');
              const group = groupList.find((g) => g.id === val);
              if (group) {
                table
                  .getColumn('Kelompok')
                  ?.setFilterValue(`${group.name} - ${group.classroom.name}`);
              } else {
                table.getColumn('Kelompok')?.setFilterValue(undefined);
              }
              table.getColumn('Siswa')?.setFilterValue(undefined);
            }}
          >
            <SelectTrigger className="min-w-0 w-full sm:min-w-[250px]">
              <SelectValue placeholder="Pilih Kelompok" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kelompok</SelectItem>
              {groupList.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {`${g.name} - ${g.classroom.name}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block">Filter Siswa</Label>
          <Select
            disabled={selectedGroupId === 'all'}
            value={selectedStudent}
            onValueChange={(val) => {
              setSelectedStudent(val);
              table.getColumn('Siswa')?.setFilterValue(val === 'all' ? undefined : val);
            }}
          >
            <SelectTrigger className="min-w-0 w-full sm:min-w-[220px]">
              <SelectValue placeholder="Pilih Siswa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Siswa</SelectItem>
              {studentByGroup.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block">Filter Jenis Target</Label>
          <Select
            onValueChange={(val) =>
              table.getColumn('Jenis Target')?.setFilterValue(val === 'all' ? undefined : val)
            }
          >
            <SelectTrigger className="min-w-0 w-full sm:min-w-[180px]">
              <SelectValue placeholder="Jenis Target" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Jenis</SelectItem>
              {Array.from(new Set(filteredData.map((d) => d.type))).map((type) => (
                <SelectItem key={type} value={type}>
                  {typeConfig[type].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block">Filter Status</Label>
          <Select
            onValueChange={(val) =>
              table.getColumn('Status')?.setFilterValue(val === 'all' ? undefined : val)
            }
          >
            <SelectTrigger className="min-w-0 w-full sm:min-w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {Array.from(new Set(filteredData.map((d) => d.status))).map((status) => (
                <SelectItem key={status} value={status}>
                  {statusConfig[status].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Calendar23
            value={selectedDateRange}
            onChange={(range) => {
              setSelectedDateRange(range);
              table.getColumn('Tanggal')?.setFilterValue('custom');
            }}
            label="Filter Tanggal"
            placeholder="Pilih Rentang Tanggal"
            className="min-w-0 w-full sm:min-w-[250px]"
          />
        </div>
      </div>

      {/* Card Statistik Target */}
      <Card>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-muted-foreground">Total Target</h4>
              <p className="font-semibold">{filteredData.length}</p>
            </div>
            <div>
              <h4 className="font-medium text-muted-foreground">Tercapai</h4>
              <p className="font-semibold text-green-600">
                {filteredData.filter((target) => target.status === 'TERCAPAI').length}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-muted-foreground">Tidak Tercapai</h4>
              <p className="font-semibold text-red-600">
                {filteredData.filter((target) => target.status === 'TIDAK_TERCAPAI').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <DataTable title={title} table={table} filterColumn="Tanggal" />

      {dialogType === 'edit' && selectedTarget && (
        <TargetEditDialog
          target={{
            id: selectedTarget.id,
            studentId: selectedTarget.student.id,
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
