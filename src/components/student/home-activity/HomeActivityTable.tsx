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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useDataTableState } from '@/lib/hooks/use-data-table';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { DataTable } from '@/components/ui/data-table';
import { Semester, HomeActivityType } from '@prisma/client';
import { HomeActivityEditDialog } from './HomeActivityEditDialog';
import { HomeActivityAlertDialog } from './HomeActivityAlertDialog';
// import { ExportToPDFButton } from './export-to-pdf-button';

export type HomeActivity = {
  id: string;
  date: string;
  activityType: HomeActivityType;
  startVerse: number;
  endVerse: number;
  note: string | null;
  group: {
    name: string;
    classroom: {
      name: string;
      academicYear: string;
      semester: Semester;
    };
    teacherGroups: {
      teacher: {
        user: {
          fullName: string;
        };
      };
    }[];
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
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [selectedWeek, setSelectedWeek] = useState<number | 'all'>('all');
  const [selectedActivityType, setSelectedActivityType] = useState<HomeActivityType | 'ALL'>('ALL');

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

  const activityTypeOptions = useMemo(() => {
    const set = new Set<HomeActivityType>();
    for (const activity of data) {
      set.add(activity.activityType);
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

  const currentPeriodData = useMemo(() => {
    if (!selectedPeriod) return null;

    const [academicYear, semester] = selectedPeriod.split('-');
    const foundData = data.find(
      (activity) =>
        activity.group.classroom.academicYear === academicYear &&
        activity.group.classroom.semester === semester
    );

    if (foundData) {
      const teacherName =
        foundData.group.teacherGroups[0]?.teacher.user.fullName || 'Tidak tersedia';

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

  const filteredData = useMemo(() => {
    if (!selectedPeriod) return data;

    const [academicYear, semester] = selectedPeriod.split('-');
    return data.filter(
      (activity) =>
        activity.group.classroom.academicYear === academicYear &&
        activity.group.classroom.semester === semester
    );
  }, [data, selectedPeriod]);

  function getWeekOfMonth(date: Date): number {
    const adjustedDate = date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return Math.ceil(adjustedDate / 7);
  }

  const columns = useMemo<ColumnDef<HomeActivity>[]>(
    () => [
      {
        accessorKey: 'date',
        id: 'Tanggal',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
        filterFn: (row, columnId) => {
          const date = new Date(row.getValue(columnId));
          const matchMonth = selectedMonth === 'all' || date.getMonth() === selectedMonth;
          const matchWeek = selectedWeek === 'all' || getWeekOfMonth(date) === selectedWeek;
          return matchMonth && matchWeek;
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
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex size-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Target Option</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-50 z-50">
                  <DropdownMenuItem
                    onClick={() => handleOpenEditDialog(user)}
                    className="flex items-center gap-2"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleOpenDeleteDialog(user)}
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          );
        },
      },
    ],
    [selectedMonth, selectedWeek, handleOpenEditDialog, handleOpenDeleteDialog]
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
          <Label className="mb-2 block">Filter Periode</Label>
          <Select
            value={selectedPeriod}
            onValueChange={(val) => {
              setSelectedPeriod(val);
            }}
          >
            <SelectTrigger className="min-w-[200px]">
              <SelectValue placeholder="Pilih Periode" />
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
          <Label className="mb-2 block">Filter Bulan</Label>
          <Select
            onValueChange={(value) => {
              const val = value === 'all' ? 'all' : parseInt(value);
              setSelectedMonth(val);
              table.getColumn('date')?.setFilterValue('custom');
            }}
          >
            <SelectTrigger className="min-w-[160px]">
              <SelectValue placeholder="Pilih Bulan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Bulan</SelectItem>
              {Array.from({ length: 12 }).map((_, i) => (
                <SelectItem key={i} value={i.toString()}>
                  {new Date(0, i).toLocaleString('id-ID', { month: 'long' })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block">Filter Minggu</Label>
          <Select
            onValueChange={(value) => {
              const val = value === 'all' ? 'all' : parseInt(value);
              setSelectedWeek(val);
              table.getColumn('date')?.setFilterValue('custom');
            }}
          >
            <SelectTrigger className="min-w-[160px]">
              <SelectValue placeholder="Pilih Minggu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Minggu</SelectItem>
              {[1, 2, 3, 4, 5].map((w) => (
                <SelectItem key={w} value={w.toString()}>
                  Minggu ke-{w}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block">Filter Jenis Aktivitas</Label>
          <Select
            value={selectedActivityType}
            onValueChange={(value) => {
              setSelectedActivityType(value as HomeActivityType | 'ALL');
              table
                .getColumn('Jenis Aktivitas')
                ?.setFilterValue(value === 'ALL' ? undefined : value);
            }}
          >
            <SelectTrigger className="min-w-[200px]">
              <SelectValue placeholder="Pilih Jenis Aktivitas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Jenis</SelectItem>
              {activityTypeOptions.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Student Info Header */}
      {currentPeriodData && (
        <div className="rounded-lg border bg-card p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">Periode:</span>
              <p className="font-medium">
                {currentPeriodData.period.academicYear} {currentPeriodData.period.semester}
              </p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Kelas:</span>
              <p className="font-medium">{currentPeriodData.period.className}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Kelompok:</span>
              <p className="font-medium">{currentPeriodData.period.groupName}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Guru Pembimbing:</span>
              <p className="font-medium">{currentPeriodData.period.teacherName}</p>
            </div>
          </div>
        </div>
      )}

      {/* <div className="flex justify-end mb-4">
        <ExportToPDFButton table={table} />
      </div> */}

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
          activity={{
            ...selectedHomeActivity,
            note: selectedHomeActivity.note ?? undefined,
          }}
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
