'use client';

import { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
      const res = await fetch('/api/admin/classroom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKelas),
      });

      if (res.ok) {
        setNamaKelas('');
        setTahunAjaran('');
        onKelasAdded();
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
        <Input
          placeholder="Tahun Ajaran (contoh: 2024/2025)"
          value={tahunAjaran}
          onChange={(e) => setTahunAjaran(e.target.value)}
        />
        <Button onClick={handleAddKelas} disabled={loading}>
          {loading ? 'Menambahkan...' : 'Tambah Kelas'}
        </Button>
      </CardContent>
    </Card>
  );
}
