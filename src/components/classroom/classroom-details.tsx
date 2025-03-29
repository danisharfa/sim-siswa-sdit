'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Siswa {
  id: string;
  nis: string;
  namaLengkap: string;
}

interface Guru {
  id: string;
  nip: string | null;
  namaLengkap: string;
}

export default function ClassroomDetails({ kelasId }: { kelasId: string }) {
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [guruList, setGuruList] = useState<Guru[]>([]);

  useEffect(() => {
    // Fetch daftar siswa dalam kelas
    fetch(`/api/classroom/${kelasId}/student`)
      .then((res) => res.json())
      .then((data) => {
        console.log('Data siswa dari API:', data);
        setSiswaList(
          data.map(
            (siswa: {
              id: string;
              nis: string;
              user?: { namaLengkap?: string };
            }) => ({
              id: siswa.id,
              nis: siswa.nis,
              namaLengkap: siswa.user?.namaLengkap || 'Tidak diketahui',
            })
          )
        );
      });

    // Fetch daftar guru dalam kelas
    fetch(`/api/classroom/${kelasId}/teacher`)
      .then((res) => res.json())
      .then((data) => {
        console.log('Data guru dari API:', data);
        setGuruList(
          data.map(
            (guru: {
              id: string;
              nip: string;
              user?: { namaLengkap?: string };
            }) => ({
              id: guru.id,
              nip: guru.nip,
              namaLengkap: guru.user?.namaLengkap || 'Tidak diketahui',
            })
          )
        );
      });
  }, [kelasId]);

  // Kolom untuk tabel siswa
  const siswaColumns = useMemo<ColumnDef<Siswa>[]>(
    () => [
      {
        accessorKey: 'nis',
        header: 'NIS',
        cell: ({ row }) => <span>{row.original.nis}</span>,
      },
      {
        accessorKey: 'namaLengkap',
        header: 'Nama Lengkap',
        cell: ({ row }) => <span>{row.original.namaLengkap}</span>,
      },
    ],
    []
  );

  // Kolom untuk tabel guru
  const guruColumns = useMemo<ColumnDef<Guru>[]>(
    () => [
      {
        accessorKey: 'nip',
        header: 'NIP',
        cell: ({ row }) => <span>{row.original.nip}</span>,
      },
      {
        accessorKey: 'namaLengkap',
        header: 'Nama Lengkap',
        cell: ({ row }) => <span>{row.original.namaLengkap}</span>,
      },
    ],
    []
  );

  // TanStack Table untuk siswa
  const siswaTable = useReactTable({
    data: siswaList,
    columns: siswaColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  // TanStack Table untuk guru
  const guruTable = useReactTable({
    data: guruList,
    columns: guruColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Detail Kelas</h2>

      {/* Tabel Siswa */}
      <Card className="mb-6">
        <CardHeader>
          <h3 className="text-lg font-semibold">Daftar Siswa</h3>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              {siswaTable.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {siswaTable.getRowModel().rows.length > 0 ? (
                siswaTable.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={siswaColumns.length}
                    className="text-center"
                  >
                    Tidak ada siswa dalam kelas ini.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Tabel Guru */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Daftar Guru</h3>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              {guruTable.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {guruTable.getRowModel().rows.length > 0 ? (
                guruTable.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={guruColumns.length}
                    className="text-center"
                  >
                    Tidak ada guru dalam kelas ini.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
