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
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useDataTableState } from '@/lib/hooks/use-data-table';
import { DataTable } from '@/components/ui/data-table';
import { Semester, TashihType } from '@prisma/client';

interface ExamResult {
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
    student: {
      nis: string;
      user: { fullName: string };
      group: {
        id: string;
        name: string;
        classroom: {
          name: string;
          academicYear: string;
          semester: Semester;
        };
      } | null;
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
  data: ExamResult[];
}

export function TeacherTashihResultTable({ data }: Props) {
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
  } = useDataTableState<ExamResult, string>();

  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState('all');

  const groupList = useMemo(() => {
    const map = new Map<string, NonNullable<ExamResult['tashihRequest']['student']['group']>>();
    for (const d of data) {
      const group = d.tashihRequest.student.group;
      if (group && !map.has(group.id)) {
        map.set(group.id, group);
      }
    }
    return Array.from(map.values());
  }, [data]);

  const academicPeriods = useMemo(() => {
    return Array.from(
      new Set(
        data
          .map((d) => d.tashihRequest.student.group)
          .filter((g): g is NonNullable<typeof g> => !!g)
          .map((g) => `${g.classroom.academicYear}-${g.classroom.semester}`)
      )
    );
  }, [data]);

  const filteredGroups = useMemo(() => {
    if (selectedPeriod === 'all') return groupList;
    const [year, semester] = selectedPeriod.split('-');
    return groupList.filter(
      (g) => g.classroom.academicYear === year && g.classroom.semester === semester
    );
  }, [groupList, selectedPeriod]);

  const studentByGroup = useMemo(() => {
    if (selectedGroupId === 'all') return [];
    return Array.from(
      new Set(
        data
          .filter((d) => d.tashihRequest.student.group?.id === selectedGroupId)
          .map((d) => d.tashihRequest.student.user.fullName)
      )
    );
  }, [selectedGroupId, data]);

  const columns = useMemo<ColumnDef<ExamResult>[]>(
    () => [
      {
        id: 'Tanggal',
        accessorKey: 'tashihSchedule.date',
        header: 'Tanggal',
        cell: ({ row }) => {
          const s = row.original.tashihSchedule;
          return `${new Date(s.date).toLocaleDateString('id-ID')} (${s.sessionName}, ${
            s.startTime
          } - ${s.endTime})`;
        },
      },
      {
        id: 'Nama Siswa',
        header: 'Nama Siswa',
        accessorFn: (row) => row.tashihRequest.student.user.fullName,
      },
      {
        id: 'Kelompok',
        header: 'Kelompok',
        accessorFn: (row) =>
          `${row.tashihRequest.student.group?.name} - ${row.tashihRequest.student.group?.classroom.name}`,
        cell: ({ row }) => (
          <Badge variant="outline">
            {`${row.original.tashihRequest.student.group?.name ?? '-'} - ${
              row.original.tashihRequest.student.group?.classroom.name ?? '-'
            }`}
          </Badge>
        ),
      },
      {
        id: 'Tahun Ajaran',
        header: 'Tahun Ajaran',
        accessorFn: (row) =>
          `${row.tashihRequest.student.group?.classroom.academicYear} ${row.tashihRequest.student.group?.classroom.semester}`,
        cell: ({ row }) => (
          <Badge variant="outline">
            {`${row.original.tashihRequest.student.group?.classroom.academicYear ?? '-'} ${
              row.original.tashihRequest.student.group?.classroom.semester ?? '-'
            }`}
          </Badge>
        ),
      },
      {
        id: 'Materi',
        header: 'Materi Ujian',
        cell: ({ row }) => {
          const r = row.original.tashihRequest;
          return (
            <Badge variant="outline">
              {r.tashihType === TashihType.ALQURAN
                ? `${r.surah?.name ?? '-'} (${r.juz?.name ?? '-'})`
                : `${r.wafa?.name ?? '-'} (Hal ${r.startPage ?? '-'}${
                    r.endPage ? `–${r.endPage}` : ''
                  })`}
            </Badge>
          );
        },
      },
      {
        id: 'Status',
        accessorKey: 'passed',
        header: 'Lulus',
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
        cell: ({ row }) => row.original.notes || '-',
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
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
  });

  return (
    <>
      <div className="grid grid-cols-1 sm:flex gap-4 mb-4">
        <Select
          value={selectedPeriod}
          onValueChange={(val) => {
            setSelectedPeriod(val);
            setSelectedGroupId('all');
            setSelectedStudent('all');
            table
              .getColumn('Tahun Ajaran')
              ?.setFilterValue(val === 'all' ? undefined : val.replace('-', ' '));
            table.getColumn('Kelompok')?.setFilterValue(undefined);
            table.getColumn('Nama Siswa')?.setFilterValue(undefined);
          }}
        >
          <SelectTrigger className="min-w-[220px]">
            <SelectValue placeholder="Pilih Tahun Ajaran" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tahun Ajaran</SelectItem>
            {academicPeriods.map((p) => (
              <SelectItem key={p} value={p}>
                {p.replace('-', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          disabled={selectedPeriod === 'all'}
          onValueChange={(val) => {
            setSelectedGroupId(val);
            setSelectedStudent('all');
            const group = groupList.find((g) => g.id === val);
            if (group) {
              table
                .getColumn('Kelompok')
                ?.setFilterValue(`${group.name} - ${group.classroom.name}`);
              table
                .getColumn('Tahun Ajaran')
                ?.setFilterValue(`${group.classroom.academicYear} ${group.classroom.semester}`);
            }

            table.getColumn('Nama Siswa')?.setFilterValue(undefined);
          }}
        >
          <SelectTrigger className="min-w-[250px]">
            <SelectValue placeholder="Pilih Kelompok" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kelompok</SelectItem>
            {filteredGroups.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {`${g.name} - ${g.classroom.name}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedStudent}
          disabled={selectedGroupId === 'all'}
          onValueChange={(val) => {
            setSelectedStudent(val);
            table.getColumn('Nama Siswa')?.setFilterValue(val === 'all' ? undefined : val);
          }}
        >
          <SelectTrigger className="min-w-[220px]">
            <SelectValue placeholder="Pilih Siswa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Siswa</SelectItem>
            {studentByGroup.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable title="Hasil Ujian Siswa Bimbingan" table={table} filterColumn="Nama Siswa" />
    </>
  );
}
