'use client';

import { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '@/components/ui/select';

interface Props {
  onKelasAdded: () => void;
}

export function AddClassroomForm({ onKelasAdded }: Props) {
  const [namaKelas, setNamaKelas] = useState('');
  const [tahunAjaran, setTahunAjaran] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAddKelas() {
    if (!namaKelas || !tahunAjaran) {
      alert('Nama kelas dan tahun ajaran wajib diisi');
      return;
    }

    setLoading(true);
    const newKelas = { namaKelas, tahunAjaran };

    try {
      const res = await fetch('/api/classroom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKelas),
      });

      if (res.ok) {
        setNamaKelas('');
        setTahunAjaran('');
        onKelasAdded(); // Refresh data kelas
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Gagal menambah kelas');
      }
    } catch {
      alert('Terjadi kesalahan, coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Tambah Kelas Baru</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Nama Kelas"
          value={namaKelas}
          onChange={(e) => setNamaKelas(e.target.value)}
        />
        <Select
          value={tahunAjaran}
          onValueChange={(val) => setTahunAjaran(val)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih Tahun Ajaran" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="2023/2024">2023/2024</SelectItem>
              <SelectItem value="2024/2025">2024/2025</SelectItem>
              <SelectItem value="2025/2026">2025/2026</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button onClick={handleAddKelas} disabled={loading}>
          {loading ? 'Menambahkan...' : 'Tambah Kelas'}
        </Button>
      </CardContent>
    </Card>
  );
}
