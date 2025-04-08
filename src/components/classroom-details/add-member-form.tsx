'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface Props {
  kelasId: string;
  onMemberAdded: () => void;
}

export function AddMemberForm({ kelasId, onMemberAdded }: Props) {
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<'teacher' | 'student'>('student');
  const [loading, setLoading] = useState(false);

  async function handleAddMember() {
    if (!userId) {
      toast.warning('ID pengguna wajib diisi');
      return;
    }

    setLoading(true);

    const endpoint =
      role === 'teacher'
        ? `/api/classroom/${kelasId}/teacher`
        : `/api/classroom/${kelasId}/student`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        toast.success('Anggota berhasil ditambahkan!');
        setUserId('');
        onMemberAdded(); // refresh data
      } else {
        const err = await res.json();
        toast.error(err.message || 'Gagal menambah anggota');
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
        <h2 className="text-xl font-semibold">Tambah Anggota Kelas</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Masukkan ID Pengguna"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
        <Select
          value={role}
          onValueChange={(val) => setRole(val as 'teacher' | 'student')}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih Peran" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="teacher">Guru</SelectItem>
              <SelectItem value="student">Siswa</SelectItem>
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
