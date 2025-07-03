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
import { useDataTableState } from '@/lib/hooks/use-data-table';
import { StudentTargetData } from '@/lib/data/student/target';
import { Card, CardContent } from '@/components/ui/card';

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

  const [selectedPeriod, setSelectedPeriod] = useState('all');

  const { data: setting } = useSWR('/api/academicSetting', fetcher);

  const academicPeriods = useMemo(() => {
    const periods = data.allTargets.map((r) => `${r.period.academicYear}-${r.period.semester}`);
    return periods;
  }, [data.allTargets]);

  const defaultPeriod = setting ? `${setting.currentYear}-${setting.currentSemester}` : 'all';

  useEffect(() => {
    if (defaultPeriod !== 'all' && academicPeriods.includes(defaultPeriod)) {
      setSelectedPeriod(defaultPeriod);
    } else if (academicPeriods.length > 0) {
      setSelectedPeriod(academicPeriods[0]);
    }
  }, [defaultPeriod, academicPeriods]);

  const currentPeriodInfo = useMemo(() => {
    if (selectedPeriod === 'all') {
      return data.allTargets[0] || null;
    }

    const [academicYear, semester] = selectedPeriod.split('-');
    const foundData = data.allTargets.find(
      (target) => target.period.academicYear === academicYear && target.period.semester === semester
    );
    return foundData || null;
  }, [selectedPeriod, data.allTargets]);

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
        header: 'Jenis',
        cell: ({ row }) => (
          <Badge variant={getTypeVariant(row.original.type)}>
            {getTypeLabel(row.original.type)}
          </Badge>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Deskripsi',
      },
      {
        accessorKey: 'material',
        header: 'Materi',
      },
      {
        accessorKey: 'deadline',
        header: 'Rentang Waktu',
      },
      {
        accessorKey: 'progressPercent',
        header: 'Progress',
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
        header: 'Status',
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
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <Label className="mb-2 block">Filter Periode</Label>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="min-w-[200px]">
              <SelectValue placeholder="Pilih Periode" />
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

      {currentPeriodInfo && (
        <Card>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Periode</h4>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
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
    </div>
  );
}
