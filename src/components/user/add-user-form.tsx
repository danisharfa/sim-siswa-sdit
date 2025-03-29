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
  onUserAdded: () => void;
}

export function AddUserForm({ onUserAdded }: Props) {
  const [username, setUsername] = useState('');
  const [namaLengkap, setNamaLengkap] = useState('');
  const [role, setRole] = useState<'teacher' | 'student'>('student');
  const [loading, setLoading] = useState(false);

  async function handleAddUser() {
    if (!username || !namaLengkap) {
      toast.warning('Nama dan Username wajib diisi');
      return;
    }

    setLoading(true);
    const newUser = { username, namaLengkap, role, password: username }; // Password default = username

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      if (res.ok) {
        toast.success('User berhasil ditambah!');
        setUsername('');
        setNamaLengkap('');
        onUserAdded(); // Refresh data
      } else {
        const errorData = await res.json();
        toast.message(errorData.message || 'Gagal menambah user');
      }
    } catch {
      toast.message('Terjadi kesalahan, coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Tambah Pengguna Baru</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Input
          placeholder="Nama"
          value={namaLengkap}
          onChange={(e) => setNamaLengkap(e.target.value)}
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
        <Button onClick={handleAddUser} disabled={loading}>
          {loading ? 'Menambahkan...' : 'Tambah Pengguna'}
        </Button>
      </CardContent>
    </Card>
  );
}
