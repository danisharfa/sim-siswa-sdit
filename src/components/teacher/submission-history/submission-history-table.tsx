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
// import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useDataTableState } from '@/hooks/use-data-table';
import { DataTableColumnHeader } from '@/components/ui/table-column-header';
import { DataTable } from '@/components/ui/data-table';

type Submission = {
  id: string;
  tanggal: string;
  jenisSetoran: string;
  surahId: number;
  surah: {
    nama: string;
  };
  ayatMulai: number;
  ayatSelesai: number;
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

export function SubmissionHistoryTable({
  data,
  title,
}: SubmissionHistoryTableProps) {
  const {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
  } = useDataTableState<Submission, string>();

  const [selectedKelompok, setSelectedKelompok] = useState<string | 'all'>(
    'all'
  );
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
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Tanggal" />
        ),
        cell: ({ row }) => (
          <span>
            {new Date(row.getValue('tanggal')).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        ),
      },
      {
        accessorKey: 'siswa.nis',
        id: 'nis',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="NIS" />
        ),
      },
      {
        accessorKey: 'siswa.user.namaLengkap',
        id: 'siswa',
        header: 'Nama Siswa',
        cell: ({ row }) => row.original.siswa.user.namaLengkap,
      },
      {
        accessorKey: 'kelompok.namaKelompok',
        id: 'namaKelompok',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Kelompok" />
        ),
        cell: ({ row }) => {
          const kelompok = row.original.kelompok;
          const kelas = kelompok.kelas;
          return `${kelompok.namaKelompok} - ${kelas.namaKelas} (${kelas.tahunAjaran})`;
        },
      },
      {
        accessorKey: 'jenisSetoran',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Jenis Setoran" />
        ),
      },
      {
        accessorKey: 'surah.nama',
        header: 'Surah',
      },
      {
        accessorKey: 'ayatMulai',
        header: 'Ayat Mulai',
      },
      {
        accessorKey: 'ayatSelesai',
        header: 'Ayat Selesai',
      },
      {
        accessorKey: 'status',
        header: 'Status',
      },
      {
        accessorKey: 'adab',
        header: 'Adab',
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
            table
              .getColumn('namaKelompok')
              ?.setFilterValue(value === 'all' ? undefined : value);
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
            table
              .getColumn('siswa')
              ?.setFilterValue(value === 'all' ? undefined : value);
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
            table
              .getColumn('jenisSetoran')
              ?.setFilterValue(value === 'all' ? undefined : value)
          }
        >
          <SelectTrigger className="min-w-[200px] w-full sm:w-[200px]">
            <SelectValue placeholder="Jenis Setoran" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Jenis</SelectItem>
            {Array.from(new Set(data.map((d) => d.jenisSetoran))).map(
              (jenis) => (
                <SelectItem key={jenis} value={jenis}>
                  {jenis}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>

      <DataTable title={title} table={table} filterColumn="tanggal" />
    </>
  );
}
