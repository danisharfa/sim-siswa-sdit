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

import { useDataTableState } from '@/lib/hooks/use-data-table';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2Icon,
  MinusCircle,
  RefreshCcw,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from 'lucide-react';

type Submission = {
  id: string;
  tanggal: string;
  jenisSetoran: string;
  juz: number;
  surahId: number;
  surah: {
    namaSurah: string;
  };
  wafaId: number;
  wafa: {
    namaBuku: string;
  };
  ayatMulai: number;
  ayatSelesai: number;
  halamanMulai: number;
  halamanSelesai: number;
  status: string;
  adab: string;
  catatan: string;
  siswa: {
    nis: string;
    user: {
      namaLengkap: string;
    };
  };
  kelompok: {
    namaKelompok: string;
    kelas: {
      namaKelas: string;
      tahunAjaran: string;
    };
  };
};

interface SubmissionHistoryTableProps {
  data: Submission[];
  title: string;
}

export function SubmissionHistoryTable({ data, title }: SubmissionHistoryTableProps) {
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
  } = useDataTableState<Submission, string>();

  const [selectedKelompok, setSelectedKelompok] = useState<string | 'all'>('all');
  const [selectedSiswa, setSelectedSiswa] = useState<string | 'all'>('all');

  const kelompokList = useMemo(
    () =>
      Array.from(
        new Map(
          data.map((d) => [
            d.kelompok.namaKelompok,
            {
              namaKelompok: d.kelompok.namaKelompok,
              namaKelas: d.kelompok.kelas.namaKelas,
              tahunAjaran: d.kelompok.kelas.tahunAjaran,
            },
          ])
        ).values()
      ),
    [data]
  );

  const siswaByKelompok = useMemo(() => {
    if (selectedKelompok === 'all') return [];
    return data
      .filter((d) => d.kelompok.namaKelompok === selectedKelompok)
      .map((d) => d.siswa.user.namaLengkap);
  }, [selectedKelompok, data]);

  const columns = useMemo<ColumnDef<Submission>[]>(
    () => [
      {
        accessorKey: 'tanggal',
        id: 'Tanggal',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
        cell: ({ row }) => (
          <span>
            {new Date(row.getValue('Tanggal')).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        ),
      },
      {
        accessorKey: 'siswa.nis',
        id: 'NIS',
        header: ({ column }) => <DataTableColumnHeader column={column} title="NIS" />,
      },
      {
        accessorKey: 'siswa.user.namaLengkap',
        id: 'Nama Siswa',
        header: 'Nama Siswa',
      },
      {
        accessorKey: 'kelompok.namaKelompok',
        id: 'Nama Kelompok',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Kelompok" />,
        cell: ({ row }) => {
          const kelompok = row.original.kelompok;
          const kelas = kelompok.kelas;
          return `${kelompok.namaKelompok} - ${kelas.namaKelas} (${kelas.tahunAjaran})`;
        },
      },
      {
        accessorKey: 'jenisSetoran',
        id: 'Jenis Setoran',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Jenis Setoran" />,
        cell: ({ row }) => (
          <div className="w-32">
            <Badge variant="outline" className="px-1.5 text-muted-foreground">
              {row.original.jenisSetoran.replaceAll('_', ' ')}
            </Badge>
          </div>
        ),
      },
      {
        accessorKey: 'juz',
        header: 'Juz',
        cell: ({ row }) => row.original.juz ?? '-',
      },
      {
        accessorKey: 'surah.namaSurah',
        id: 'Surah',
        header: 'Surah',
        cell: ({ row }) => row.original.surah?.namaSurah ?? '-',
      },
      {
        accessorKey: 'ayatMulai',
        id: 'Ayat Mulai',
        header: 'Ayat Mulai',
        cell: ({ row }) => row.original.ayatMulai ?? '-',
      },
      {
        accessorKey: 'ayatSelesai',
        id: 'Ayat Selesai',
        header: 'Ayat Selesai',
        cell: ({ row }) => row.original.ayatSelesai ?? '-',
      },
      {
        accessorKey: 'wafa.namaBuku',
        id: 'Wafa',
        header: 'Wafa',
        cell: ({ row }) => row.original.wafa?.namaBuku ?? '-',
      },
      {
        accessorKey: 'halamanMulai',
        id: 'Halaman Mulai',
        header: 'Halaman Mulai',
        cell: ({ row }) => row.original.halamanMulai ?? '-',
      },
      {
        accessorKey: 'halamanSelesai',
        id: 'Halaman Selesai',
        header: 'Halaman Selesai',
        cell: ({ row }) => row.original.halamanSelesai ?? '-',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className="flex gap-1 px-1.5 text-muted-foreground [&_svg]:size-3"
          >
            {row.original.status === 'LULUS' ? (
              <CheckCircle2Icon className="text-green-500 dark:text-green-400" />
            ) : row.original.status === 'MENGULANG' ? (
              <RefreshCcw className="text-yellow-500 dark:text-yellow-400" />
            ) : (
              <XCircle className="text-red-500 dark:text-red-400" />
            )}

            {row.original.status.replaceAll('_', ' ')}
          </Badge>
        ),
      },
      {
        accessorKey: 'adab',
        header: 'Adab',
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className="flex gap-1 px-1.5 text-muted-foreground [&_svg]:size-3"
          >
            {row.original.adab === 'BAIK' ? (
              <ThumbsUp className="text-green-500 dark:text-green-400" />
            ) : row.original.adab === 'KURANG_BAIK' ? (
              <MinusCircle className="text-yellow-500 dark:text-yellow-400" />
            ) : (
              <ThumbsDown className="text-red-500 dark:text-red-400" />
            )}

            {row.original.adab.replaceAll('_', ' ')}
          </Badge>
        ),
      },
      {
        accessorKey: 'catatan',
        header: 'Catatan',
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
      <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-4 mb-4 w-full">
        {/* Filter Kelompok */}
        <Select
          onValueChange={(value) => {
            setSelectedKelompok(value);
            table.getColumn('namaKelompok')?.setFilterValue(value === 'all' ? undefined : value);
            setSelectedSiswa('all');
            table.getColumn('siswa')?.setFilterValue(undefined);
          }}
        >
          <SelectTrigger className="min-w-[200px] w-full sm:w-[300px]">
            <SelectValue placeholder="Pilih Kelompok" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kelompok</SelectItem>
            {kelompokList.map((kelompok) => (
              <SelectItem
                key={`${kelompok.namaKelompok}-${kelompok.namaKelas}-${kelompok.tahunAjaran}`}
                value={kelompok.namaKelompok}
              >
                {`${kelompok.namaKelompok} - ${kelompok.namaKelas} (${kelompok.tahunAjaran})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filter Siswa (tergantung kelompok) */}
        <Select
          disabled={selectedKelompok === 'all'}
          value={selectedSiswa}
          onValueChange={(value) => {
            setSelectedSiswa(value);
            table.getColumn('siswa')?.setFilterValue(value === 'all' ? undefined : value);
          }}
        >
          <SelectTrigger className="min-w-[200px] w-full sm:w-[250px]">
            <SelectValue placeholder="Pilih Siswa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Siswa</SelectItem>
            {Array.from(new Set(siswaByKelompok)).map((siswa) => (
              <SelectItem key={siswa} value={siswa}>
                {siswa}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filter Jenis Setoran */}
        <Select
          onValueChange={(value) =>
            table.getColumn('jenisSetoran')?.setFilterValue(value === 'all' ? undefined : value)
          }
        >
          <SelectTrigger className="min-w-[200px] w-full sm:w-[200px]">
            <SelectValue placeholder="Jenis Setoran" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Jenis</SelectItem>
            {Array.from(new Set(data.map((d) => d.jenisSetoran))).map((jenis) => (
              <SelectItem key={jenis} value={jenis}>
                {jenis}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable title={title} table={table} filterColumn="Tanggal" />
    </>
  );
}
