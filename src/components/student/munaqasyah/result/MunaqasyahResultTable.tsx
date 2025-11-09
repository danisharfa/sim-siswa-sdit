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
import { ExportToPDFButton } from './ExportToPDFButton';

export type MunaqasyahResult = {
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
      totalScore: number;
      details: Array<{
        surahId: number;
        initialScore: number;
        khofiAwalAyat: number;
        khofiMakhroj: number;
        khofiTajwidMad: number;
        jaliBaris: number;
        jaliLebihSatuKalimat: number;
        totalScore: number;
        note?: string | null;
      }>;
    } | null;
    munaqasyah?: {
      totalScore: number;
      details: Array<{
        questionNo: number;
        initialScore: number;
        khofiAwalAyat: number;
        khofiMakhroj: number;
        khofiTajwidMad: number;
        jaliBaris: number;
        jaliLebihSatuKalimat: number;
        totalScore: number;
        note?: string | null;
      }>;
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
  title: string;
}

const gradeLabels: Record<string, string> = {
  MUMTAZ: 'Mumtaz',
  JAYYID_JIDDAN: 'Jayyid Jiddan',
  JAYYID: 'Jayyid',
  TIDAK_LULUS: 'Tidak Lulus',
};

export function MunaqasyahResultTable({ data, title }: Props) {
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
  } = useDataTableState<MunaqasyahResult, string>();

  const [selectedPeriod, setSelectedPeriod] = useState<string | 'ALL'>('ALL');
  const [selectedBatch, setSelectedBatch] = useState<string | 'ALL'>('ALL');
  const [selectedStage, setSelectedStage] = useState<string | 'ALL'>('ALL');
  const [selectedJuz, setSelectedJuz] = useState<string | 'ALL'>('ALL');

  const academicPeriods = useMemo(() => {
    const set = new Set<string>();
    for (const d of data) {
      set.add(`${d.request.group.classroom.academicYear}__${d.request.group.classroom.semester}`);
    }
    return Array.from(set).sort();
  }, [data]);

  const batchOptions = useMemo(() => {
    const set = new Set<MunaqasyahBatch>();
    for (const d of data) {
      set.add(d.request.batch);
    }
    return Array.from(set);
  }, [data]);

  const stageOptions = useMemo(() => {
    const set = new Set<string>();
    for (const d of data) {
      set.add(d.request.stage);
    }
    return Array.from(set);
  }, [data]);

  const juzOptions = useMemo(() => {
    const set = new Set<string>();
    for (const d of data) {
      set.add(d.request.juz.name);
    }
    return Array.from(set).sort();
  }, [data]);

  // Event handlers untuk filter
  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
    setSelectedBatch('ALL');
    setSelectedStage('ALL');
    setSelectedJuz('ALL');
  };

  const handleBatchChange = (value: string) => {
    setSelectedBatch(value);
  };

  const handleStageChange = (value: string) => {
    setSelectedStage(value);
  };

  const handleJuzChange = (value: string) => {
    setSelectedJuz(value);
  };

  const filteredData = useMemo(() => {
    return data.filter((result) => {
      // Filter by period
      if (selectedPeriod !== 'ALL') {
        const periodKey = `${result.request.group.classroom.academicYear}__${result.request.group.classroom.semester}`;
        if (periodKey !== selectedPeriod) return false;
      }

      // Filter by batch
      if (selectedBatch !== 'ALL') {
        if (result.request.batch !== selectedBatch) return false;
      }

      // Filter by stage
      if (selectedStage !== 'ALL') {
        if (result.request.stage !== selectedStage) return false;
      }

      // Filter by juz
      if (selectedJuz !== 'ALL') {
        if (result.request.juz.name !== selectedJuz) return false;
      }

      return true;
    });
  }, [data, selectedPeriod, selectedBatch, selectedStage, selectedJuz]);

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
        id: 'Tanggal',
        accessorKey: 'schedule.date',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
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
        id: 'Batch',
        header: 'Batch',
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.request.batch.replaceAll('_', ' ')}</Badge>
        ),
      },
      {
        id: 'Stage',
        header: 'Tahapan Ujian',
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.request.stage.replaceAll('_', ' ')}</Badge>
        ),
      },
      {
        id: 'Juz',
        header: 'Juz',
        cell: ({ row }) => <Badge variant="outline">{row.original.request.juz.name}</Badge>,
      },
      {
        id: 'Penguji',
        header: 'Penguji',
        cell: ({ row }) => {
          const examiner = row.original.schedule.examiner;
          return (
            <div className="text-sm">
              {examiner ? (
                <Badge variant="outline">{examiner.user.fullName}</Badge>
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
        header: 'Nilai',
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">
              {row.original.score?.toFixed(1) || '0.0'} (
              {gradeLabels[row.original.grade] || row.original.grade})
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
              <div className="font-bold text-base">{(finalResult.finalScore ?? 0).toFixed(1)}</div>
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
          <Label className="mb-2 block sr-only">Filter Tahun Akademik</Label>
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Pilih Tahun Akademik" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Tahun Akademik</SelectItem>
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
          <Label className="mb-2 block sr-only">Filter Batch</Label>
          <Select value={selectedBatch} onValueChange={handleBatchChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Pilih Batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Batch</SelectItem>
              {batchOptions.map((batch) => (
                <SelectItem key={batch} value={batch}>
                  {batch.replaceAll('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block sr-only">Filter Tahap Munaqasyah</Label>
          <Select value={selectedStage} onValueChange={handleStageChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Pilih Tahap" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Tahapan Ujian</SelectItem>
              {stageOptions.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {stage.replaceAll('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block sr-only">Filter Juz</Label>
          <Select value={selectedJuz} onValueChange={handleJuzChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Pilih Juz" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Juz</SelectItem>
              {juzOptions.map((juz) => (
                <SelectItem key={juz} value={juz}>
                  {juz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ExportToPDFButton
          table={table}
          studentName={filteredData[0]?.request?.student?.user?.fullName}
          studentNis={filteredData[0]?.request?.student?.nis}
          academicYear={currentPeriodInfo ? `${currentPeriodInfo.academicYear} ${currentPeriodInfo.semester}` : ''}
        />
      </div>

      {currentPeriodInfo && (
        <Card>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Tahun Akademik</h4>
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

      <DataTable title={title} table={table} showColumnFilter={false} />
    </>
  );
}
