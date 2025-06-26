'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Calendar22 } from '@/components/calendar/calendar-22';
import { Role, Gender, BloodType } from '@prisma/client';

type UpdatedUserProfile = {
  fullName?: string;
  nis?: string;
  nisn?: string;
  nip?: string;
  birthDate?: string;
  birthPlace?: string;
  gender?: Gender;
  bloodType?: BloodType;
  address?: string;
  phoneNumber?: string;
  email?: string;
};

export function UserDetail({ userId, role }: { userId: string; role: Role }) {
  const [updatedData, setUpdatedData] = useState<UpdatedUserProfile>({});
  const [date, setDate] = useState<Date>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(`/api/users/detail/${userId}`);
        const { data } = await res.json();

        const profile = data[role];

        setUpdatedData({
          fullName: data.fullName,
          nis: role === Role.student ? profile?.nis ?? '' : undefined,
          nisn: role === Role.student ? profile?.nisn ?? '' : undefined,
          nip: role !== Role.student ? profile?.nip ?? '' : undefined,
          birthPlace: profile?.birthPlace ?? '',
          gender: profile?.gender ?? Gender.PILIH,
          bloodType: profile?.bloodType ?? BloodType.PILIH,
          address: profile?.address ?? '',
          phoneNumber: profile?.phoneNumber ?? '',
          email: profile?.email ?? '',
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
  }, [userId, role]);

  const handleChange = (field: keyof UpdatedUserProfile, value: string) => {
    setUpdatedData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...updatedData,
        role,
        birthDate: date?.toISOString(),
      };

      const res = await fetch(`/api/users/detail/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();

      toast.success('Detail user berhasil diperbarui!');
    } catch {
      toast.error('Gagal memperbarui detail user!');
    }
  };

  if (loading) return <p>Loading...</p>;

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

            <Label>{role === Role.student ? 'NIS' : 'NIP'}</Label>
            <Input
              value={role === Role.student ? updatedData.nis ?? '' : updatedData.nip ?? ''}
              onChange={(e) => handleChange(role === Role.student ? 'nis' : 'nip', e.target.value)}
            />

            {role === Role.student && (
              <>
                <Label>NISN</Label>
                <Input
                  value={updatedData.nisn ?? ''}
                  onChange={(e) => handleChange('nisn', e.target.value)}
                />
              </>
            )}

            <Label>Tempat Lahir</Label>
            <Textarea
              value={updatedData.birthPlace ?? ''}
              onChange={(e) => handleChange('birthPlace', e.target.value)}
            />

            <Calendar22 value={date} onChange={setDate} label='Tanggal Lahir'/>

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
                    {g.replace('_', ' ')}
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
                {Object.values(BloodType).map((bt) => (
                  <SelectItem key={bt} value={bt}>
                    {bt}
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
