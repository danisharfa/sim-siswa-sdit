'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // ✅ Import useRouter untuk refresh halaman
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
  kelasId: string;
}

export function AddMemberForm({ kelasId }: Props) {
  const [identifier, setIdentifier] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter(); // ✅ Gunakan useRouter untuk navigasi/refresh

  async function handleAddMember() {
    if (!identifier || !role) {
      alert('NIS/NIP dan peran wajib diisi');
      return;
    }

    setLoading(true);
    const newMember = { identifier, role, kelasId };

    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember),
      });

      if (res.ok) {
        setIdentifier('');
        setRole('');
        router.refresh(); // ✅ Refresh halaman setelah anggota ditambahkan
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Gagal menambah anggota');
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
        <h2 className="text-xl font-semibold">Tambah Anggota Baru</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Masukkan NIS/NIP"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />
        <Select value={role} onValueChange={(val) => setRole(val)}>
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
        <Button onClick={handleAddMember} disabled={loading}>
          {loading ? 'Menambahkan...' : 'Tambah Anggota'}
        </Button>
      </CardContent>
    </Card>
  );
}
