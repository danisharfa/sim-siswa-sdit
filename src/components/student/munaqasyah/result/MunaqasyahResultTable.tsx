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
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useDataTableState } from '@/lib/hooks/use-data-table';
import { DataTable } from '@/components/ui/data-table';
import { Semester, MunaqasyahBatch } from '@prisma/client';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';

interface MunaqasyahResult {
  id: string;
  score: number | null;
  grade: string;
  passed: boolean;
  createdAt: string;
  updatedAt: string;
  request: {
    id: string;
    batch: MunaqasyahBatch;
    stage: string;
    status: string;
    juz: { name: string };
    student: {
      nis: string;
      user: { fullName: string };
    };
    teacher: {
      user: { fullName: string };
    };
    group: {
      name: string;
      classroom: {
        name: string;
        academicYear: string;
        semester: Semester;
      };
    };
  };
  schedule: {
    date: string;
    sessionName: string;
    startTime: string;
    endTime: string;
    location: string;
    examiner: {
      user: { fullName: string };
    } | null;
  };
  scoreDetails?: {
    tasmi?: {
      tajwid: number;
      kelancaran: number;
      adab: number;
      note?: string | null;
      totalScore: number;
    } | null;
    munaqasyah?: {
      tajwid: number;
      kelancaran: number;
      adab: number;
      note?: string | null;
      totalScore: number;
    } | null;
  };
  finalResult?: {
    finalScore: number;
    finalGrade: string;
    passed: boolean;
  } | null;
}

interface Props {
  data: MunaqasyahResult[];
}

const gradeLabels: Record<string, string> = {
  MUMTAZ: 'Mumtaz',
  JAYYID_JIDDAN: 'Jayyid Jiddan',
  JAYYID: 'Jayyid',
  TIDAK_LULUS: 'Tidak Lulus',
};

const stageLabels: Record<string, string> = {
  TASMI: 'Tasmi',
  MUNAQASYAH: 'Munaqasyah',
};

const batchLabels: Record<MunaqasyahBatch, string> = {
  [MunaqasyahBatch.TAHAP_1]: 'Tahap 1',
  [MunaqasyahBatch.TAHAP_2]: 'Tahap 2',
  [MunaqasyahBatch.TAHAP_3]: 'Tahap 3',
  [MunaqasyahBatch.TAHAP_4]: 'Tahap 4',
};

export function MunaqasyahResultTable({ data }: Props) {
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
  } = useDataTableState<MunaqasyahResult, string>();

  const [selectedPeriod, setSelectedPeriod] = useState<string | 'ALL'>('ALL');
  const [selectedStage, setSelectedStage] = useState<string | 'ALL'>('ALL');

  const academicPeriods = useMemo(() => {
    const set = new Set<string>();
    for (const d of data) {
      set.add(`${d.request.group.classroom.academicYear}__${d.request.group.classroom.semester}`);
    }
    return Array.from(set).sort();
  }, [data]);

  const stageOptions = useMemo(() => {
    const set = new Set<string>();
    for (const d of data) {
      set.add(d.request.stage);
    }
    return Array.from(set);
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter((result) => {
      // Filter by period
      if (selectedPeriod !== 'ALL') {
        const periodKey = `${result.request.group.classroom.academicYear}__${result.request.group.classroom.semester}`;
        if (periodKey !== selectedPeriod) return false;
      }

      if (selectedStage !== 'ALL') {
        if (result.request.stage !== selectedStage) return false;
      }

      return true;
    });
  }, [data, selectedPeriod, selectedStage]);

  const currentPeriodInfo = useMemo(() => {
    if (filteredData.length === 0) return null;

    const firstResult = filteredData[0];
    return {
      academicYear: firstResult.request.group.classroom.academicYear,
      semester: firstResult.request.group.classroom.semester,
      className: firstResult.request.group.classroom.name,
      groupName: firstResult.request.group.name,
      teacherName: firstResult.request.teacher.user.fullName,
    };
  }, [filteredData]);

  const columns = useMemo<ColumnDef<MunaqasyahResult>[]>(
    () => [
      {
        id: 'Tanggal dan Waktu',
        accessorKey: 'schedule.date',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal dan Waktu" />,
        cell: ({ row }) => {
          const s = row.original.schedule;
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
        id: 'Materi Ujian',
        header: 'Materi Ujian',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1 min-w-[140px]">
            <Badge variant="secondary" className="text-xs w-fit">
              {batchLabels[row.original.request.batch]}
            </Badge>
            <Badge variant="outline" className="text-xs w-fit">
              {stageLabels[row.original.request.stage]}
            </Badge>
            <Badge variant="default" className="text-xs w-fit">
              {row.original.request.juz.name}
            </Badge>
          </div>
        ),
      },
      {
        id: 'Penguji',
        header: 'Penguji',
        cell: ({ row }) => {
          const examiner = row.original.schedule.examiner;
          return (
            <div className="text-sm">
              {examiner ? (
                <Badge variant="secondary">{examiner.user.fullName}</Badge>
              ) : (
                <span className="text-muted-foreground text-xs">Koordinator Al-Qur&apos;an</span>
              )}
            </div>
          );
        },
      },
      {
        id: 'Nilai',
        accessorKey: 'score',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nilai" />,
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">
              {row.original.score?.toFixed(1) || '0.0'} (
              {gradeLabels[row.original.grade] || row.original.grade})
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              {row.original.scoreDetails?.tasmi && (
                <div>Tasmi: {row.original.scoreDetails.tasmi.totalScore?.toFixed(1) || '0.0'}</div>
              )}
              {row.original.scoreDetails?.munaqasyah && (
                <div>
                  Munaqasyah: {row.original.scoreDetails.munaqasyah.totalScore?.toFixed(1) || '0.0'}
                </div>
              )}
            </div>
          </div>
        ),
      },
      {
        id: 'Status',
        accessorKey: 'passed',
        header: 'Status',
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
        id: 'Nilai Final',
        header: 'Nilai Final',
        cell: ({ row }) => {
          const finalResult = row.original.finalResult;
          if (!finalResult) {
            return <div className="text-xs text-muted-foreground">Belum ada hasil final</div>;
          }

          return (
            <div className="text-sm">
              <div className="font-bold text-base">{finalResult.finalScore.toFixed(1)}</div>
              <div className="font-medium text-primary text-xs">
                {gradeLabels[finalResult.finalGrade] || finalResult.finalGrade}
              </div>
              <Badge
                variant={finalResult.passed ? 'default' : 'destructive'}
                className="text-xs mt-1"
              >
                {finalResult.passed ? '✅ LULUS' : '❌ TIDAK LULUS'}
              </Badge>
            </div>
          );
        },
      },
      {
        id: 'Detail',
        header: 'Detail',
        cell: ({ row }) => {
          const { scoreDetails } = row.original;
          if (!scoreDetails || (!scoreDetails.tasmi && !scoreDetails.munaqasyah)) return '-';

          return (
            <div className="text-xs space-y-1">
              {scoreDetails.tasmi && (
                <div className="space-y-0.5">
                  <div className="font-medium">Tasmi:</div>
                  <div>Tajwid: {scoreDetails.tasmi.tajwid || 0}</div>
                  <div>Kelancaran: {scoreDetails.tasmi.kelancaran || 0}</div>
                  <div>Adab: {scoreDetails.tasmi.adab || 0}</div>
                  {scoreDetails.tasmi.note && (
                    <div className="text-muted-foreground">Catatan: {scoreDetails.tasmi.note}</div>
                  )}
                </div>
              )}
              {scoreDetails.munaqasyah && (
                <div className="space-y-0.5">
                  <div className="font-medium">Munaqasyah:</div>
                  <div>Tajwid: {scoreDetails.munaqasyah.tajwid || 0}</div>
                  <div>Kelancaran: {scoreDetails.munaqasyah.kelancaran || 0}</div>
                  <div>Adab: {scoreDetails.munaqasyah.adab || 0}</div>
                  {scoreDetails.munaqasyah.note && (
                    <div className="text-muted-foreground">
                      Catatan: {scoreDetails.munaqasyah.note}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        },
      },
    ],
    []
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
          <Label className="mb-2 block">Filter Periode</Label>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Pilih Periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Periode</SelectItem>
              {academicPeriods.map((val) => {
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
          <Label className="mb-2 block">Filter Jenis Munaqasyah</Label>
          <Select value={selectedStage} onValueChange={setSelectedStage}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Pilih Jenis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Jenis</SelectItem>
              {stageOptions.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {stageLabels[stage]}
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
                  {currentPeriodInfo.academicYear} {currentPeriodInfo.semester}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Kelas</h4>
                <p className="font-semibold">{currentPeriodInfo.className}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Kelompok</h4>
                <p className="font-semibold">{currentPeriodInfo.groupName}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Guru Pembimbing</h4>
                <p className="font-semibold">{currentPeriodInfo.teacherName}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <DataTable title="Hasil Munaqasyah Saya" table={table} />
    </>
  );
}
