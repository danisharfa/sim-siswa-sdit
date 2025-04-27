'use client';

import { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getErrorMessage } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
  onGroupAdded: () => void;
}

export function AddGroupForm({ onGroupAdded }: Props) {
  const [namaKelompok, setNamaKelompok] = useState('');
  const [namaKelas, setNamaKelas] = useState('');
  const [tahunAjaran, setTahunAjaran] = useState('');
  const [nip, setNip] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAddGroup() {
    if (!namaKelompok || !namaKelas || !tahunAjaran || !nip) {
      toast.warning('Semua field wajib diisi');
      return;
    }

    setLoading(true);

    const newGroup = { namaKelompok, namaKelas, tahunAjaran, nip };

    try {
      const res = await fetch('/api/admin/group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGroup),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message || 'Kelompok berhasil ditambahkan');
        setNamaKelompok('');
        setNamaKelas('');
        setTahunAjaran('');
        setNip('');
        onGroupAdded();
      } else {
        toast.error(data.message || 'Gagal menambah kelompok');
      }
    } catch (error) {
      console.error(error);
      const message = getErrorMessage(error);
      toast.error(message || 'Terjadi kesalahan saat menambah kelompok');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Tambah Kelompok Baru</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Nama Kelompok"
          value={namaKelompok}
          onChange={(e) => setNamaKelompok(e.target.value)}
        />
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
        <Input
          placeholder="NIP Wali Kelompok"
          value={nip}
          onChange={(e) => setNip(e.target.value)}
        />
        <Button onClick={handleAddGroup} disabled={loading}>
          {loading ? 'Menambahkan...' : 'Tambah Kelompok'}
        </Button>
      </CardContent>
    </Card>
  );
}
