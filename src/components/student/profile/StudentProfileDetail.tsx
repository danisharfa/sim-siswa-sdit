'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
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

type StudentProfile = {
  birthDate?: string;
  birthPlace?: string;
  gender?: Gender;
  bloodType?: BloodType;
  address?: string;
  phoneNumber?: string;
  email?: string;
};

type StudentIdentity = {
  fullName: string;
  nis: string;
  nisn: string;
};

export default function StudentProfileDetail({ userId }: { userId: string }) {
  const [date, setDate] = useState<Date>();
  const [identity, setIdentity] = useState<StudentIdentity | null>(null);
  const [updatedData, setUpdatedData] = useState<StudentProfile>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(`/api/users/detail/${userId}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.message);

        const user = json.data;
        const profile = user.student;

        setIdentity({
          fullName: user.fullName,
          nis: profile?.nis || '',
          nisn: profile?.nisn || '',
        });

        setUpdatedData({
          birthPlace: user.birthPlace || '',
          gender: user.gender || Gender.PILIH,
          bloodType: user.bloodType || BloodType.PILIH,
          address: user.address || '',
          phoneNumber: user.phoneNumber || '',
          email: user.email || '',
        });

        if (user.birthDate) {
          setDate(new Date(user.birthDate));
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [userId]);

  const handleChange = (field: keyof StudentProfile, value: string) => {
    setUpdatedData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...updatedData,
        birthDate: date?.toISOString(),
        role: Role.student,
      };

      const res = await fetch(`/api/users/detail/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
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
      <CardContent className="pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Label>Nama Lengkap</Label>
            <Input value={identity?.fullName ?? ''} readOnly />

            <Label>NIS</Label>
            <Input value={identity?.nis ?? ''} readOnly />

            <Label>NISN</Label>
            <Input value={identity?.nisn ?? ''} readOnly />

            <Label>Tempat Lahir</Label>
            <Textarea
              value={updatedData.birthPlace ?? ''}
              onChange={(e) => handleChange('birthPlace', e.target.value)}
            />

            <Calendar22 value={date} onChange={setDate} label="Tanggal Lahir" />

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
              value={updatedData.bloodType || BloodType.PILIH}
              onValueChange={(val) => handleChange('bloodType', val)}
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
