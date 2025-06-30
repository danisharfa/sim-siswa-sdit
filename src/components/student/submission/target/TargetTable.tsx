'use client';

import { useMemo, useState, useEffect } from 'react';
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

export type TargetItem = {
  id: string;
  type: 'TAHFIDZ' | 'TAHSIN_ALQURAN' | 'TAHSIN_WAFA';
  description: string;
  startDate: Date;
  endDate: Date;
  status: 'TERCAPAI' | 'TIDAK_TERCAPAI' | 'SEBAGIAN_TERCAPAI';
  progressPercent: number;
  material: string;
  deadline: string;
};

interface Props {
  data: StudentTargetData;
  title: string;
}

const fetchSetting = async () => {
  const res = await fetch('/api/academicSetting');
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
};

export function TargetTable({ data, title }: Props) {
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
  } = useDataTableState<TargetItem, string>();

  const [selectedPeriod, setSelectedPeriod] = useState('all');

  const { data: setting } = useSWR('/api/academicSetting', fetchSetting);

  // Debug logs
  console.log('Target data:', data);
  console.log('All targets:', data.allTargets);

  const academicPeriods = useMemo(() => {
    const periods = data.allTargets.map((r) => `${r.period.academicYear}-${r.period.semester}`);
    console.log('Mapped periods:', periods);
    return periods;
  }, [data.allTargets]);

  const defaultPeriod = setting ? `${setting.currentYear}-${setting.currentSemester}` : 'all';

  useEffect(() => {
    console.log('Default period:', defaultPeriod);
    console.log('Available periods:', academicPeriods);

    if (defaultPeriod !== 'all' && academicPeriods.includes(defaultPeriod)) {
      setSelectedPeriod(defaultPeriod);
    } else if (academicPeriods.length > 0) {
      setSelectedPeriod(academicPeriods[0]);
    }
  }, [defaultPeriod, academicPeriods]);

  // Get current period data
  const currentPeriodData = useMemo(() => {
    if (selectedPeriod === 'all') {
      return data.allTargets[0] || null;
    }

    const [academicYear, semester] = selectedPeriod.split('-');
    const foundData = data.allTargets.find(
      (target) => target.period.academicYear === academicYear && target.period.semester === semester
    );
    console.log('Current period data:', foundData);
    return foundData || null;
  }, [selectedPeriod, data.allTargets]);

  // Transform the data to flatten targets
  const tableData = useMemo<TargetItem[]>(() => {
    if (!currentPeriodData) return [];

    return currentPeriodData.targets.map((target) => {
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
        deadline: format(target.endDate, 'dd MMM yyyy', { locale: id }),
      };
    });
  }, [currentPeriodData]);

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

  const getTypeVariant = (type: string) => {
    switch (type) {
      case 'TAHFIDZ':
        return 'default';
      case 'TAHSIN_ALQURAN':
        return 'secondary';
      case 'TAHSIN_WAFA':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const columns = useMemo<ColumnDef<TargetItem>[]>(
    () => [
      {
        accessorKey: 'type',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Jenis" />,
        cell: ({ row }) => (
          <Badge variant={getTypeVariant(row.original.type)}>
            {getTypeLabel(row.original.type)}
          </Badge>
        ),
      },
      {
        accessorKey: 'description',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Deskripsi" />,
        cell: ({ row }) => <div className="font-medium max-w-xs">{row.original.description}</div>,
      },
      {
        accessorKey: 'material',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Materi" />,
        cell: ({ row }) => <div className="max-w-xs">{row.original.material}</div>,
      },
      {
        accessorKey: 'deadline',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Deadline" />,
        cell: ({ row }) => <div className="text-center">{row.original.deadline}</div>,
      },
      {
        accessorKey: 'progressPercent',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Progress" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2 min-w-[120px]">
            <Progress value={row.original.progressPercent} className="h-2 flex-1" />
            <span className="text-sm font-medium min-w-[35px]">
              {row.original.progressPercent}%
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
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

  // Show loading state while data is being fetched
  if (!data || !data.allTargets) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">Memuat data target...</p>
      </div>
    );
  }

  // Show message if no academic periods found
  if (academicPeriods.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">Tidak ada data target ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Period Filter */}
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <Label className="mb-2 block">Filter Tahun Ajaran</Label>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="min-w-[200px]">
              <SelectValue placeholder="Pilih Tahun Ajaran" />
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
      </div>

      {/* Student Info Header */}
      {currentPeriodData && (
        <div className="rounded-lg border bg-card p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">Kelas:</span>
              <p className="font-medium">{currentPeriodData.period.className}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Guru:</span>
              <p className="font-medium">{currentPeriodData.period.teacherName}</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Total Target:</span>
                <p className="font-medium">{currentPeriodData.targets.length}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Tercapai:</span>
                <p className="font-medium text-green-600">
                  {currentPeriodData.targets.filter((t) => t.status === 'TERCAPAI').length}
                </p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Tidak Tercapai:</span>
                <p className="font-medium text-red-600">
                  {currentPeriodData.targets.filter((t) => t.status === 'TIDAK_TERCAPAI').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      {currentPeriodData && tableData.length > 0 ? (
        <DataTable title={title} table={table} filterColumn="description" />
      ) : (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            {!currentPeriodData
              ? 'Pilih periode untuk melihat data target'
              : 'Tidak ada data target untuk periode ini'}
          </p>
        </div>
      )}
    </div>
  );
}
