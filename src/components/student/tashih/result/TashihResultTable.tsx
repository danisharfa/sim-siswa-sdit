'use client';

import { useEffect, useMemo, useState } from 'react';
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
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useDataTableState } from '@/lib/hooks/use-data-table';
import { DataTable } from '@/components/ui/data-table';
import { Semester, TashihType } from '@prisma/client';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { Card, CardContent } from '@/components/ui/card';

interface TashihResult {
  id: string;
  passed: boolean;
  notes: string | null;
  tashihRequest: {
    tashihType: TashihType;
    surah: { name: string } | null;
    juz: { name: string } | null;
    wafa: { name: string } | null;
    startPage: number | null;
    endPage: number | null;
    teacher: { user: { fullName: string } | null };
    group: {
      name: string;
      classroom: {
        name: string;
        academicYear: string;
        semester: Semester;
      };
    };
  };
  tashihSchedule: {
    date: string;
    sessionName: string;
    startTime: string;
    endTime: string;
    location: string;
  };
}

interface Props {
  data: TashihResult[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function TashihResultTable({ data }: Props) {
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
  } = useDataTableState<TashihResult, string>();

  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedTashihType, setSelectedTashihType] = useState<TashihType | 'ALL'>('ALL');

  const { data: setting } = useSWR('/api/academicSetting', fetcher);

  const academicPeriods = useMemo(() => {
    return Array.from(
      new Set(
        data.map(
          (d) =>
            `${d.tashihRequest.group.classroom.academicYear}-${d.tashihRequest.group.classroom.semester}`
        )
      )
    );
  }, [data]);

  const defaultPeriod = setting ? `${setting.currentYear}-${setting.currentSemester}` : '';

  const tashihTypeOptions = useMemo(() => {
    const set = new Set<TashihType>();
    for (const result of data) {
      set.add(result.tashihRequest.tashihType);
    }
    return Array.from(set);
  }, [data]);

  useEffect(() => {
    if (defaultPeriod && !selectedPeriod) {
      if (academicPeriods.includes(defaultPeriod)) {
        setSelectedPeriod(defaultPeriod);
      } else if (academicPeriods.length > 0) {
        setSelectedPeriod(academicPeriods[0]);
      }
    }
  }, [defaultPeriod, academicPeriods, selectedPeriod]);

  const currentPeriodInfo = useMemo(() => {
    if (!selectedPeriod) return null;

    const [academicYear, semester] = selectedPeriod.split('-');
    const foundData = data.find(
      (result) =>
        result.tashihRequest.group.classroom.academicYear === academicYear &&
        result.tashihRequest.group.classroom.semester === semester
    );

    if (foundData) {
      return {
        period: {
          academicYear,
          semester,
          className: foundData.tashihRequest.group.classroom.name,
          groupName: foundData.tashihRequest.group.name,
          teacherName: foundData.tashihRequest.teacher.user?.fullName || 'Tidak tersedia',
        },
      };
    }

    return null;
  }, [selectedPeriod, data]);

  const filteredData = useMemo(() => {
    if (!selectedPeriod) return data;

    const [academicYear, semester] = selectedPeriod.split('-');
    return data.filter(
      (result) =>
        result.tashihRequest.group.classroom.academicYear === academicYear &&
        result.tashihRequest.group.classroom.semester === semester
    );
  }, [data, selectedPeriod]);

  const columns = useMemo<ColumnDef<TashihResult>[]>(
    () => [
      {
        id: 'Tanggal',
        accessorKey: 'tashihSchedule.date',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
        cell: ({ row }) => {
          const s = row.original.tashihSchedule;
          const date = new Date(s.date).toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });
          return (
            <div className="text-sm min-w-[180px]">
              <div className="font-medium">{date}</div>
              <div className="text-muted-foreground">{s.sessionName}</div>
              <div className="text-muted-foreground text-xs">
                {s.startTime} - {s.endTime}
              </div>
              <div className="text-muted-foreground text-xs">📍 {s.location}</div>
            </div>
          );
        },
      },
      {
        id: 'Jenis Tashih',
        header: 'Jenis Tashih',
        filterFn: (row) => {
          if (selectedTashihType === 'ALL') return true;
          return row.original.tashihRequest.tashihType === selectedTashihType;
        },
        cell: ({ row }) => (
          <Badge variant="secondary" className="w-fit">
            {row.original.tashihRequest.tashihType.replaceAll('_', ' ')}
          </Badge>
        ),
      },
      {
        id: 'Materi',
        header: 'Materi Ujian',
        cell: ({ row }) => {
          const r = row.original.tashihRequest;
          const materi =
            r.tashihType === TashihType.ALQURAN
              ? `${r.surah?.name ?? '-'} (${r.juz?.name ?? '-'})`
              : `${r.wafa?.name ?? '-'} (Hal ${r.startPage ?? '-'}${
                  r.endPage ? `–${r.endPage}` : ''
                })`;
          return <span>{materi}</span>;
        },
      },
      {
        id: 'Status',
        accessorKey: 'passed',
        header: 'Hasil',
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={
              row.original.passed
                ? 'text-green-600 border-green-600'
                : 'text-red-600 border-red-600'
            }
          >
            {row.original.passed ? 'Lulus' : 'Tidak Lulus'}
          </Badge>
        ),
      },
      {
        id: 'Catatan',
        accessorKey: 'notes',
        header: 'Catatan',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.notes || '-'}</span>
        ),
      },
    ],
    [selectedTashihType]
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
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <>
      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <Label className="mb-2 block">Filter Tahun Akademik</Label>
          <Select
            value={selectedPeriod}
            onValueChange={(val) => {
              setSelectedPeriod(val);
            }}
          >
            <SelectTrigger className="min-w-[200px]">
              <SelectValue placeholder="Pilih Tahun Ajaran" />
            </SelectTrigger>
            <SelectContent>
              {academicPeriods.map((period) => (
                <SelectItem key={period} value={period}>
                  {period.replace('-', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block">Filter Jenis Tashih</Label>
          <Select
            value={selectedTashihType}
            onValueChange={(value) => {
              setSelectedTashihType(value as TashihType | 'ALL');
              table.getColumn('Jenis Tashih')?.setFilterValue(value === 'ALL' ? undefined : value);
            }}
          >
            <SelectTrigger className="min-w-[180px]">
              <SelectValue placeholder="Pilih Jenis Tashih" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Jenis</SelectItem>
              {tashihTypeOptions.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.replaceAll('_', ' ')}
                </SelectItem>
              ))}
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
          </CardContent>
        </Card>
      )}

      <DataTable title="Hasil Tashih Saya" table={table} showColumnFilter={false} />

      {selectedPeriod && filteredData.length === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center mt-4">
          <p className="text-muted-foreground">
            Tidak ada hasil tashih untuk periode {selectedPeriod.replace('-', ' ')}.
          </p>
        </div>
      )}
    </>
  );
}
