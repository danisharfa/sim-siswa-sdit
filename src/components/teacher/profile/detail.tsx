'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker-plus';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Gender, BloodType, Role } from '@prisma/client';

type TeacherProfile = {
  birthDate?: string;
  birthPlace?: string;
  gender?: Gender;
  bloodType?: BloodType;
  address?: string;
  phoneNumber?: string;
  email?: string;
};

type TeacherIdentity = {
  fullName: string;
  nip: string;
};

export default function TeacherProfileDetail({ userId }: { userId: string }) {
  const [identity, setIdentity] = useState<TeacherIdentity | null>(null);
  const [updatedData, setUpdatedData] = useState<TeacherProfile>({});
  const [date, setDate] = useState<Date>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(`/api/users/detail/${userId}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.message);

        const user = json.data;
        const profile = user.teacher;

        setIdentity({
          fullName: user.fullName,
          nip: profile?.nip || '',
        });

        setUpdatedData({
          birthPlace: profile?.birthPlace || '',
          gender: profile?.gender || Gender.PILIH,
          bloodType: profile?.bloodType || BloodType.PILIH,
          address: profile?.address || '',
          phoneNumber: profile?.phoneNumber || '',
          email: profile?.email || '',
        });

        if (profile?.birthDate) setDate(new Date(profile.birthDate));
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [userId]);

  const handleChange = (field: keyof TeacherProfile, value: string) => {
    setUpdatedData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...updatedData,
        birthDate: date?.toISOString(),
        role: Role.teacher,
      };

      const res = await fetch(`/api/users/detail/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();

      toast.success('Detail user berhasil diperbarui!');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Gagal memperbarui detail user!');
    }
  };

  const labelMap = (val: string) =>
    val === 'PILIH'
      ? '-- Pilih --'
      : val
          .replace('_', ' ')
          .toLowerCase()
          .replace(/^\w/, (c) => c.toUpperCase());

  if (loading) return <p>Loading...</p>;

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Detail Guru</h2>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Label>Nama Lengkap</Label>
            <Input value={identity?.fullName ?? ''} readOnly />

            <Label>NIP</Label>
            <Input value={identity?.nip ?? ''} readOnly />

            <Label>Tempat Lahir</Label>
            <Textarea
              value={updatedData.birthPlace ?? ''}
              onChange={(e) => handleChange('birthPlace', e.target.value)}
            />

            <Label>Tanggal Lahir</Label>
            <DatePicker value={date} onChange={setDate} />

            <Label>Jenis Kelamin</Label>
            <Select
              value={updatedData.gender ?? Gender.PILIH}
              onValueChange={(val) => handleChange('gender', val as Gender)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Jenis Kelamin" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(Gender).map((g) => (
                  <SelectItem key={g} value={g}>
                    {labelMap(g)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Label>Golongan Darah</Label>
            <Select
              value={updatedData.bloodType ?? BloodType.PILIH}
              onValueChange={(val) => handleChange('bloodType', val as BloodType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Golongan Darah" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(BloodType).map((b) => (
                  <SelectItem key={b} value={b}>
                    {labelMap(b)}
                  </SelectItem>
                ))}
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
