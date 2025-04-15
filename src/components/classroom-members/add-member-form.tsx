'use client';

import { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface Props {
  kelasId: string;
  onMemberAdded: () => void;
}

// ✅ Update AddMemberForm agar hanya menangani siswa (NIS)
export function AddMemberForm({ kelasId, onMemberAdded }: Props) {
  const [nis, setNis] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAddMember() {
    if (!nis) {
      toast.warning('NIS wajib diisi');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/classroom/${kelasId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nis }),
      });

      const result = await res.json();

      if (res.ok) {
        toast.success(result.message || 'Siswa berhasil ditambahkan!');
        setNis('');
        onMemberAdded();
      } else {
        toast.error(result.error || 'Gagal menambahkan siswa');
      }
    } catch {
      toast.error('Terjadi kesalahan, coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Tambah Siswa ke Kelas</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Masukkan NIS Siswa"
          value={nis}
          onChange={(e) => setNis(e.target.value)}
          disabled={loading}
        />
        <Button onClick={handleAddMember} disabled={loading || !nis}>
          {loading ? 'Menambahkan...' : 'Tambah Siswa'}
        </Button>
      </CardContent>
    </Card>
  );
}
