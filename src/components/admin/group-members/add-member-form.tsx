'use client';

import { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface Props {
  groupId: string;
  onMemberAdded: () => void;
}

export function AddMemberForm({ groupId, onMemberAdded }: Props) {
  const [nis, setNis] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAddMember() {
    if (!nis) {
      toast.warning('NIS wajib diisi');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/group/${groupId}/member`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nis }),
      });

      const resData = await res.json();
      if (resData.success) {
        toast.success(
          resData.message || 'Siswa berhasil ditambahkan ke kelompok!'
        );
        setNis('');
        onMemberAdded();
      } else {
        toast.message(resData.message || 'Gagal menambahkan siswa ke kelompok');
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
        <h2 className="text-xl font-semibold">Tambah Siswa ke Kelompok</h2>
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
