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
import { toast } from 'sonner';

interface Props {
  kelasId: string;
  onMemberAdded: () => void;
}

export function AddMemberForm({ kelasId, onMemberAdded }: Props) {
  const [identifier, setIdentifier] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAddMember() {
    if (!identifier || !role) {
      toast.warning('NIS/NIP dan peran wajib diisi');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/classroom/${kelasId}/add-member`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, role }),
      });

      if (res.ok) {
        toast.success('Anggota berhasil ditambah!');
        setIdentifier('');
        setRole('');
        onMemberAdded();
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || 'Gagal menambah anggota!');
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
        <h2 className="text-xl font-semibold">Tambah Anggota Baru</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Masukkan NIS/NIP"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          disabled={loading}
        />
        <Select value={role} onValueChange={setRole} disabled={loading}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih Peran" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="guru">Guru</SelectItem>
              <SelectItem value="siswa">Siswa</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button
          onClick={handleAddMember}
          disabled={loading || !identifier || !role}
        >
          {loading ? 'Menambahkan...' : 'Tambah Anggota'}
        </Button>
      </CardContent>
    </Card>
  );
}
