'use client';

import { useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table';
import useSWR from 'swr';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { useDataTableState } from '@/lib/hooks/use-data-table';
import { StudentTargetData } from '@/lib/data/student/target';
import { Card, CardContent } from '@/components/ui/card';
import { ExportToPDFButton } from './ExportToPDFButton';

export type TargetItem = {
  id: string;
  type: 'TAHFIDZ' | 'TAHSIN_ALQURAN' | 'TAHSIN_WAFA';
  description: string;
  startDate: Date;
  endDate: Date;
  status: 'TERCAPAI' | 'TIDAK_TERCAPAI' | 'SEBAGIAN_TERCAPAI';
  progressPercent: number;
  material: string;
  deadline: string; // Format: "dd MMM - dd MMM yyyy"
};

interface Props {
  data: StudentTargetData;
  title: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function TargetTable({ data, title }: Props) {
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
  } = useDataTableState<TargetItem, string>();

  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedTargetType, setSelectedTargetType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedTargetPeriod, setSelectedTargetPeriod] = useState('all');

  const { data: setting } = useSWR('/api/academicSetting', fetcher);

  const academicPeriods = useMemo(() => {
    const periods = data.allTargets.map((r) => `${r.period.academicYear}-${r.period.semester}`);
    return periods;
  }, [data.allTargets]);

  const defaultPeriod = setting ? `${setting.currentYear}-${setting.currentSemester}` : '';

  // Set default period without useEffect
  const initialPeriod = useMemo(() => {
    if (!selectedPeriod && academicPeriods.length > 0) {
      if (defaultPeriod && academicPeriods.includes(defaultPeriod)) {
        return defaultPeriod;
      }
      return academicPeriods[0];
    }
    return selectedPeriod;
  }, [defaultPeriod, academicPeriods, selectedPeriod]);

  // Update selectedPeriod if it's empty and we have a valid initialPeriod
  if (!selectedPeriod && initialPeriod) {
    setSelectedPeriod(initialPeriod);
  }

  const currentPeriodInfo = useMemo(() => {
    if (!selectedPeriod) {
      return data.allTargets[0] || null;
    }

    const [academicYear, semester] = selectedPeriod.split('-');
    const foundData = data.allTargets.find(
      (target) => target.period.academicYear === academicYear && target.period.semester === semester
    );
    return foundData || null;
  }, [selectedPeriod, data.allTargets]);

  // Get available filter options
  const filteredByPeriod = useMemo(() => {
    if (!currentPeriodInfo) return [];
    return currentPeriodInfo.targets;
  }, [currentPeriodInfo]);

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
      const periodKey = `${format(target.startDate, 'yyyy-MM-dd')}|${format(
        target.endDate,
        'yyyy-MM-dd'
      )}`;
      periods.add(periodKey);
    });
    return Array.from(periods).map((period) => {
      const [startDate, endDate] = period.split('|');
      return { startDate, endDate, key: period };
    });
  }, [filteredByPeriod]);

  // Event handlers
  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
    setSelectedTargetType('all');
    setSelectedStatus('all');
    setSelectedTargetPeriod('all');
    // Clear table filters
    table.getColumn('Jenis')?.setFilterValue(undefined);
    table.getColumn('Status')?.setFilterValue(undefined);
    table.getColumn('Periode Target')?.setFilterValue(undefined);
  };

  const handleTargetTypeChange = (value: string) => {
    setSelectedTargetType(value);
    table.getColumn('Jenis')?.setFilterValue(value === 'all' ? undefined : value);
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    table.getColumn('Status')?.setFilterValue(value === 'all' ? undefined : value);
  };

  const handleTargetPeriodChange = (value: string) => {
    setSelectedTargetPeriod(value);
    table.getColumn('Periode Target')?.setFilterValue(value === 'all' ? undefined : value);
  };

  const tableData = useMemo<TargetItem[]>(() => {
    if (!currentPeriodInfo) return [];

    return currentPeriodInfo.targets.map((target) => {
      let material = '';

      if (target.type === 'TAHFIDZ' || target.type === 'TAHSIN_ALQURAN') {
        if (target.surahStart && target.surahEnd) {
          if (target.surahStart.id === target.surahEnd.id) {
            material = `${target.surahStart.name} ayat ${target.startAyat}-${target.endAyat}`;
          } else {
            material = `${target.surahStart.name} ayat ${target.startAyat} - ${target.surahEnd.name} ayat ${target.endAyat}`;
          }
        }
      } else if (target.type === 'TAHSIN_WAFA') {
        if (target.wafa) {
          material = `${target.wafa.name} halaman ${target.startPage}-${target.endPage}`;
        }
      }

      return {
        id: target.id,
        type: target.type,
        description: target.description,
        startDate: target.startDate,
        endDate: target.endDate,
        status: target.status,
        progressPercent: target.progressPercent,
        material,
        deadline: `${format(target.startDate, 'dd MMM', { locale: id })} - ${format(
          target.endDate,
          'dd MMM yyyy',
          { locale: id }
        )}`,
      };
    });
  }, [currentPeriodInfo]);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'TAHFIDZ':
        return 'Tahfidz';
      case 'TAHSIN_ALQURAN':
        return 'Tahsin Al-Quran';
      case 'TAHSIN_WAFA':
        return 'Tahsin Wafa';
      default:
        return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'TERCAPAI':
        return 'Tercapai';
      case 'TIDAK_TERCAPAI':
        return 'Tidak Tercapai';
      case 'SEBAGIAN_TERCAPAI':
        return 'Sebagian Tercapai';
      default:
        return status;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'TERCAPAI':
        return 'default';
      case 'TIDAK_TERCAPAI':
        return 'destructive';
      case 'SEBAGIAN_TERCAPAI':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const columns = useMemo<ColumnDef<TargetItem>[]>(
    () => [
      {
        id: 'Periode Target',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Periode Target" />,
        accessorFn: (row) => row.deadline,
        filterFn: (row, columnId, value) => {
          if (!value || value === 'all') return true;
          const rowPeriod = `${format(row.original.startDate, 'yyyy-MM-dd')}|${format(
            row.original.endDate,
            'yyyy-MM-dd'
          )}`;
          return rowPeriod === value;
        },
        cell: ({ row }) => <div className="text-sm">{row.original.deadline}</div>,
      },
      {
        accessorKey: 'type',
        id: 'Jenis',
        header: 'Jenis Target',
        cell: ({ row }) => (
          <div className="font-medium">{row.original.type.replaceAll('_', ' ')}</div>
        ),
      },
      {
        accessorKey: 'material',
        id: 'Detail Target',
        header: 'Detail Target',
        cell: ({ row }) => (
          <div className="max-w-xs">
            <div className="font-medium">{row.original.material}</div>
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
        cell: ({ row }) => (
          <Badge variant={getStatusVariant(row.original.status)}>
            {getStatusLabel(row.original.status)}
          </Badge>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (!data || !data.allTargets) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">Memuat data target...</p>
      </div>
    );
  }

  if (academicPeriods.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">Tidak ada data target ditemukan.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-4 items-end">
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

        <Select value={selectedTargetType} onValueChange={handleTargetTypeChange}>
          <Label className="mb-2 block sr-only">Filter Jenis Target</Label>
          <SelectTrigger className="min-w-[200px]">
            <SelectValue placeholder="Pilih Jenis Target" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Jenis Target</SelectItem>
            {availableTargetTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {getTypeLabel(type)}
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
                {getStatusLabel(status)}
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

        <ExportToPDFButton
          table={table}
          studentName={data.fullName}
          studentNis={data.nis}
          academicYear={selectedPeriod ? selectedPeriod.replace('-', ' ') : ''}
        />
      </div>

      {currentPeriodInfo && (
        <Card>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Tahun Akademik</h4>
                <p className="font-semibold">
                  {currentPeriodInfo.period.academicYear} {currentPeriodInfo.period.semester}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Kelas</h4>
                <p className="font-semibold">{currentPeriodInfo.period.className}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Kelompok</h4>
                <p className="font-semibold">{currentPeriodInfo.period.groupName}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Guru Pembimbing</h4>
                <p className="font-semibold">{currentPeriodInfo.period.teacherName}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium text-muted-foreground">Total Target:</h4>
                  <p className="font-semibold">{currentPeriodInfo.targets.length}</p>
                </div>
                <div>
                  <h4 className="font-medium text-muted-foreground">Tercapai:</h4>
                  <p className="font-semibold text-green-600">
                    {currentPeriodInfo.targets.filter((t) => t.status === 'TERCAPAI').length}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-muted-foreground">Tidak Tercapai:</h4>
                  <p className="font-semibold text-red-600">
                    {currentPeriodInfo.targets.filter((t) => t.status === 'TIDAK_TERCAPAI').length}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      {currentPeriodInfo && tableData.length > 0 ? (
        <DataTable title={title} table={table} showColumnFilter={false} />
      ) : (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            {!currentPeriodInfo
              ? 'Pilih periode untuk melihat data target'
              : 'Tidak ada data target untuk periode ini'}
          </p>
        </div>
      )}
    </>
  );
}
