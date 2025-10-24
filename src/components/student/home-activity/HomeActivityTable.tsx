'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { useDataTableState } from '@/lib/hooks/use-data-table';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { DataTable } from '@/components/ui/data-table';
import { Semester, HomeActivityType } from '@prisma/client';
import { HomeActivityEditDialog } from './HomeActivityEditDialog';
import { HomeActivityAlertDialog } from './HomeActivityAlertDialog';
import { type DateRange } from 'react-day-picker';
import { Calendar23 } from '@/components/layout/calendar/calendar-23';
import { ExportToPDFButton } from './ExportToPDFButton';
import { Card, CardContent } from '@/components/ui/card';

export type HomeActivity = {
  id: string;
  date: string;
  activityType: HomeActivityType;
  startVerse: number;
  endVerse: number;
  note: string | null;
  student: {
    nis: string;
    user: {
      fullName: string;
    };
  };
  group: {
    name: string;
    classroom: {
      name: string;
      academicYear: string;
      semester: Semester;
    };
    teacher: {
      user: {
        fullName: string;
      };
    } | null;
  };
  juz: { name: string };
  surah: { name: string };
};

interface Props {
  data: HomeActivity[];
  title: string;
  onRefresh: () => void;
}

const fetchSetting = async () => {
  const res = await fetch('/api/academicSetting');
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
};

export function HomeActivityTable({ data, title, onRefresh }: Props) {
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
    selectedItem: selectedHomeActivity,
    setSelectedItem: setSelectedHomeActivity,
    dialogType,
    setDialogType,
  } = useDataTableState<HomeActivity, 'edit' | 'delete'>();

  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedActivityType, setSelectedActivityType] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const handleOpenEditDialog = useCallback(
    (activity: HomeActivity) => {
      setSelectedHomeActivity(activity);
      setDialogType('edit');
    },
    [setSelectedHomeActivity, setDialogType]
  );

  const handleOpenDeleteDialog = useCallback(
    (activity: HomeActivity) => {
      setSelectedHomeActivity(activity);
      setDialogType('delete');
    },
    [setSelectedHomeActivity, setDialogType]
  );

  const { data: setting } = useSWR('/api/academicSetting', fetchSetting);

  const academicPeriods = useMemo(() => {
    return Array.from(
      new Set(data.map((d) => `${d.group.classroom.academicYear}-${d.group.classroom.semester}`))
    );
  }, [data]);

  const defaultPeriod = setting ? `${setting.currentYear}-${setting.currentSemester}` : '';

  const filteredData = useMemo(() => {
    if (!selectedPeriod) return data;

    const [academicYear, semester] = selectedPeriod.split('-');
    return data.filter(
      (activity) =>
        activity.group.classroom.academicYear === academicYear &&
        activity.group.classroom.semester === semester
    );
  }, [data, selectedPeriod]);

  const activityTypeOptions = useMemo(() => {
    const set = new Set<HomeActivityType>();
    for (const activity of filteredData) {
      set.add(activity.activityType);
    }
    return Array.from(set);
  }, [filteredData]);

  // ===== EVENT HANDLERS =====
  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
  };

  const handleActivityTypeChange = (value: string) => {
    setSelectedActivityType(value);
    table.getColumn('Jenis Aktivitas')?.setFilterValue(value === 'all' ? undefined : value);
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    table.getColumn('Tanggal')?.setFilterValue('custom');
  };

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
      (activity) =>
        activity.group.classroom.academicYear === academicYear &&
        activity.group.classroom.semester === semester
    );

    if (foundData) {
      const teacherName = foundData.group.teacher?.user.fullName || 'Tidak tersedia';

      return {
        period: {
          academicYear,
          semester,
          className: foundData.group.classroom.name,
          groupName: foundData.group.name,
          teacherName,
        },
      };
    }

    return null;
  }, [selectedPeriod, data]);

  const columns = useMemo<ColumnDef<HomeActivity>[]>(
    () => [
      {
        accessorKey: 'date',
        id: 'Tanggal',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
        filterFn: (row, columnId) => {
          if (!dateRange?.from && !dateRange?.to) return true;
          const date = new Date(row.getValue(columnId));
          const isAfterStart = !dateRange.from || date >= dateRange.from;
          const isBeforeEnd = !dateRange.to || date <= dateRange.to;
          return isAfterStart && isBeforeEnd;
        },
        cell: ({ row }) => (
          <span>
            {new Date(row.original.date).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        ),
      },
      {
        accessorKey: 'activityType',
        id: 'Jenis Aktivitas',
        header: 'Jenis Aktivitas',
        cell: ({ row }) => <Badge variant="secondary">{row.original.activityType}</Badge>,
      },
      {
        header: 'Surah',
        id: 'Surah',
        accessorFn: (row) => row.surah.name,
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">{row.original.surah.name}</div>
            <div className="text-muted-foreground">{row.original.juz.name}</div>
          </div>
        ),
      },
      {
        header: 'Ayat',
        accessorFn: (row) => `${row.startVerse}-${row.endVerse}`,
      },
      {
        accessorKey: 'note',
        header: 'Catatan',
        cell: ({ row }) => row.original.note || '-',
      },
      {
        id: 'actions',
        enableHiding: false,
        header: 'Aksi',
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => handleOpenEditDialog(user)}>
                <Pencil />
                Edit
              </Button>

              <Button variant="destructive" size="sm" onClick={() => handleOpenDeleteDialog(user)}>
                <Trash2 />
                Delete
              </Button>
            </div>
          );
        },
      },
    ],
    [dateRange, handleOpenEditDialog, handleOpenDeleteDialog]
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
      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <Label className="mb-2 block sr-only">Filter Tahun Akademik</Label>
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
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
          <Label className="mb-2 block sr-only">Filter Jenis Aktivitas</Label>
          <Select value={selectedActivityType} onValueChange={handleActivityTypeChange}>
            <SelectTrigger className="min-w-[200px]">
              <SelectValue placeholder="Pilih Jenis Aktivitas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Jenis</SelectItem>
              {activityTypeOptions.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Calendar23 value={dateRange} onChange={handleDateRangeChange} />

        <ExportToPDFButton
          table={table}
          studentName={data[0]?.student?.user?.fullName}
          studentNis={data[0]?.student?.nis}
          academicYear={selectedPeriod ? selectedPeriod.replace('-', ' ') : ''}
        />
      </div>

      {/* Student Info Header */}
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
          </CardContent>
        </Card>
      )}

      <DataTable title={title} table={table} filterColumn="Surah" showColumnFilter={false} />

      {selectedPeriod && filteredData.length === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center mt-4">
          <p className="text-muted-foreground">
            Tidak ada data aktivitas rumah untuk periode {selectedPeriod.replace('-', ' ')}.
          </p>
        </div>
      )}

      {dialogType === 'edit' && selectedHomeActivity && (
        <HomeActivityEditDialog
          activity={selectedHomeActivity}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedHomeActivity(null);
              setDialogType(null);
            }
          }}
          onSave={() => {
            onRefresh();
            setSelectedHomeActivity(null);
            setDialogType(null);
          }}
        />
      )}
      {dialogType === 'delete' && selectedHomeActivity && (
        <HomeActivityAlertDialog
          activity={selectedHomeActivity}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedHomeActivity(null);
              setDialogType(null);
            }
          }}
          onConfirm={() => {
            onRefresh();
            setSelectedHomeActivity(null);
            setDialogType(null);
          }}
        />
      )}
    </>
  );
}
