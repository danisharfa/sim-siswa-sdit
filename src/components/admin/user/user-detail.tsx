'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { toast } from 'sonner';

type UpdatedUserProfile = {
  fullName?: string;
  nis?: string;
  nip?: string;
  birthDate?: string;
  birthPlace?: string;
  gender?: string;
  bloodType?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
};

type User = {
  role: 'student' | 'teacher' | 'coordinator';
  fullName: string;
  profile?: {
    nis?: string;
    nip?: string;
    birthPlace?: string;
    birthDate?: string;
    gender?: string;
    bloodType?: string;
    address?: string;
    phoneNumber?: string;
    email?: string;
  };
};

export function UserDetail({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedData, setUpdatedData] = useState<UpdatedUserProfile>({});
  const [date, setDate] = useState<Date>();

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(`/api/users/detail/${userId}`);
        const json = await res.json();

        if (!json.success) throw new Error(json.message);

        const userData = json.data;
        const profile =
          userData.role === 'student'
            ? userData.student
            : userData.role === 'teacher'
            ? userData.teacher
            : userData.coordinator;

        setUser(userData);
        setUpdatedData({
          fullName: userData.fullName || '',
          nis: profile?.nis || '',
          nip: profile?.nip || '',
          birthPlace: profile?.birthPlace || '',
          gender: profile?.gender || 'PILIH',
          bloodType: profile?.bloodType || 'PILIH',
          address: profile?.address || '',
          phoneNumber: profile?.phoneNumber || '',
          email: profile?.email || '',
        });

        if (profile?.birthDate) {
          setDate(new Date(profile.birthDate));
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [userId]);

  const handleChange = (field: string, value: string) => {
    setUpdatedData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!user) return;

    try {
      const res = await fetch(`/api/users/detail/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...user,
          ...updatedData,
          birthDate: date?.toISOString() ?? user.profile?.birthDate,
        }),
      });

      if (res.ok) {
        toast.success('Detail user berhasil diperbarui!');
        const detailRes = await fetch(`/api/users/detail/${userId}`);
        const detailData = await detailRes.json();
        setUser(detailData);
      } else {
        toast.success('Gagal memperbarui detail user!');
      }
    } catch (error) {
      toast.success('Gagal memperbarui detail user!');
      console.error('Error updating user:', error);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>User tidak ditemukan</p>;

  const isStudent = user.role === 'student';

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Detail Pengguna</h2>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Label>Nama Lengkap</Label>
            <Input
              value={updatedData.fullName ?? ''}
              onChange={(e) => handleChange('fullName', e.target.value)}
            />

            <Label>{isStudent ? 'NIS' : 'NIP'}</Label>
            <Input
              value={isStudent ? updatedData.nis ?? '' : updatedData.nip ?? ''}
              onChange={(e) => handleChange(isStudent ? 'nis' : 'nip', e.target.value)}
            />

            <Label>Tempat Lahir</Label>
            <Textarea
              value={updatedData.birthPlace ?? ''}
              onChange={(e) => handleChange('birthPlace', e.target.value)}
            />

            <Label>Tanggal Lahir</Label>
            <DatePicker value={date} onChange={setDate} />

            <Label>Jenis Kelamin</Label>
            <Select
              value={updatedData.gender || 'PILIH'}
              onValueChange={(val) => handleChange('gender', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Jenis Kelamin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PILIH">--Pilih--</SelectItem>
                <SelectItem value="LAKI_LAKI">Laki-laki</SelectItem>
                <SelectItem value="PEREMPUAN">Perempuan</SelectItem>
              </SelectContent>
            </Select>

            <Label>Golongan Darah</Label>
            <Select
              value={updatedData.bloodType || 'PILIH'}
              onValueChange={(val) => handleChange('bloodType', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Golongan Darah" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PILIH">--Pilih--</SelectItem>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="B">B</SelectItem>
                <SelectItem value="AB">AB</SelectItem>
                <SelectItem value="O">O</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label>Alamat</Label>
            <Textarea
              value={updatedData.address ?? ''}
              onChange={(e) => handleChange('address', e.target.value)}
            />

            <Label>Email</Label>
            <Input
              value={updatedData.email ?? ''}
              onChange={(e) => handleChange('email', e.target.value)}
            />

            <Label>No. HP</Label>
            <Input
              value={updatedData.phoneNumber ?? ''}
              onChange={(e) => handleChange('phoneNumber', e.target.value)}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button onClick={handleSubmit}>Simpan Perubahan</Button>
      </CardFooter>
    </Card>
  );
}
