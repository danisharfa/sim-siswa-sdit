'use client';

import { useMemo, useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { useDataTableState } from '@/lib/hooks/use-data-table';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { DataTable } from '@/components/ui/data-table';
import { HomeActivityType, Semester } from '@prisma/client';
import { Label } from '@/components/ui/label';

interface HomeActivity {
  id: string;
  date: string;
  activityType: HomeActivityType;
  startVerse: number;
  endVerse: number;
  note: string | null;
  student: {
    nis: string;
    fullName: string;
  };
  group: {
    name: string;
    classroom: {
      name: string;
      academicYear: string;
      semester: Semester;
    };
  };
  surah: { name: string };
  juz: { name: string };
}

interface Props {
  data: HomeActivity[];
  title: string;
}

export function HomeActivityHistoryTable({ data, title }: Props) {
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
  } = useDataTableState<HomeActivity, string>();

  const [selectedYearSemester, setSelectedYearSemester] = useState<string | 'ALL'>('ALL');
  const [selectedActivityType, setSelectedActivityType] = useState<HomeActivityType | 'ALL'>('ALL');
  const [selectedGroup, setSelectedGroup] = useState<string | 'ALL'>('ALL');
  const [selectedStudent, setSelectedStudent] = useState<string | 'ALL'>('ALL');

  const yearSemesterOptions = useMemo(() => {
    const set = new Set<string>();
    for (const activity of data) {
      set.add(`${activity.group.classroom.academicYear}__${activity.group.classroom.semester}`);
    }
    return Array.from(set);
  }, [data]);

  const activityTypeOptions = useMemo(() => {
    const set = new Set<HomeActivityType>();
    for (const activity of data) {
      set.add(activity.activityType);
    }
    return Array.from(set);
  }, [data]);

  const groupOptions = useMemo(() => {
    const set = new Set<string>();
    for (const activity of data) {
      set.add(`${activity.group.name} - ${activity.group.classroom.name}`);
    }
    return Array.from(set).sort();
  }, [data]);

  const filteredStudents = useMemo(() => {
    if (selectedGroup === 'ALL') return [];
    return Array.from(
      new Set(
        data
          .filter((activity) => {
            const groupName = `${activity.group.name} - ${activity.group.classroom.name}`;
            return groupName === selectedGroup;
          })
          .map((activity) => activity.student.fullName)
      )
    ).sort();
  }, [selectedGroup, data]);

  const columns = useMemo<ColumnDef<HomeActivity>[]>(
    () => [
      {
        accessorKey: 'date',
        id: 'Tanggal',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
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
        id: 'Siswa',
        header: 'Siswa',
        accessorFn: (row) => row.student.fullName,
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">{row.original.student.fullName}</div>
            <div className="text-muted-foreground">{row.original.student.nis}</div>
          </div>
        ),
      },
      {
        id: 'Kelompok',
        header: 'Kelompok',
        accessorFn: (row) => `${row.group.name} - ${row.group.classroom.name}`,
      },
      {
        id: 'Tahun Ajaran',
        header: 'Tahun Ajaran',
        accessorFn: (row) => `${row.group.classroom.academicYear} ${row.group.classroom.semester}`,
      },
      {
        id: 'Jenis Aktivitas',
        header: 'Jenis Aktivitas',
        accessorFn: (row) => row.activityType,
        cell: ({ row }) => (
          <Badge variant="secondary" className="w-fit">
            {row.original.activityType}
          </Badge>
        ),
      },
      {
        id: 'Surah',
        header: 'Surah',
        accessorFn: (row) => `${row.surah.name} (${row.startVerse} - ${row.endVerse})`,
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">{`${row.original.surah.name} (${row.original.startVerse} - ${row.original.endVerse})`}</div>
            <div className="text-muted-foreground">{row.original.juz.name}</div>
          </div>
        ),
      },
      {
        id: 'Catatan',
        header: 'Catatan',
        accessorKey: 'note',
        cell: ({ row }) => {
          const note = row.original.note;
          return (
            <span className="text-muted-foreground max-w-xs truncate">{note ? note : '-'}</span>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data,
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
          <Label className="mb-2 block">Filter Tahun Ajaran</Label>
          <Select
            value={selectedYearSemester}
            onValueChange={(value) => {
              setSelectedYearSemester(value);
              setSelectedGroup('ALL');
              setSelectedStudent('ALL');
              table
                .getColumn('Tahun Ajaran')
                ?.setFilterValue(value === 'ALL' ? undefined : value.replace('__', ' '));
              table.getColumn('Kelompok')?.setFilterValue(undefined);
              table.getColumn('Siswa')?.setFilterValue(undefined);
            }}
          >
            <SelectTrigger className="min-w-[250px]">
              <SelectValue placeholder="Pilih Tahun Ajaran" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Tahun Ajaran</SelectItem>
              {yearSemesterOptions.map((val) => {
                const [year, sem] = val.split('__');
                return (
                  <SelectItem key={val} value={val}>
                    {year} {sem}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block">Filter Kelompok</Label>
          <Select
            value={selectedGroup}
            disabled={selectedYearSemester === 'ALL'}
            onValueChange={(value) => {
              setSelectedGroup(value);
              setSelectedStudent('ALL');
              table.getColumn('Kelompok')?.setFilterValue(value === 'ALL' ? undefined : value);
              table.getColumn('Siswa')?.setFilterValue(undefined);
            }}
          >
            <SelectTrigger className="min-w-[250px]">
              <SelectValue placeholder="Pilih Kelompok" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Kelompok</SelectItem>
              {groupOptions.map((group) => (
                <SelectItem key={group} value={group}>
                  {group}
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

        <div>
          <Label className="mb-2 block">Filter Siswa</Label>
          <Select
            value={selectedStudent}
            disabled={selectedGroup === 'ALL'}
            onValueChange={(value) => {
              setSelectedStudent(value);
              table.getColumn('Siswa')?.setFilterValue(value === 'ALL' ? undefined : value);
            }}
          >
            <SelectTrigger className="min-w-[250px]">
              <SelectValue placeholder="Pilih Siswa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Siswa</SelectItem>
              {filteredStudents.map((student) => (
                <SelectItem key={student} value={student}>
                  {student}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable title={title} table={table} filterColumn="Tanggal" />
    </>
  );
}
