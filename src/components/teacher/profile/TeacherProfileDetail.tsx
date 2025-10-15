'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
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
import { Field, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Calendar22 } from '@/components/calendar/calendar-22';
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
  const [saving, setSaving] = useState(false);

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
          birthPlace: user.birthPlace || '',
          gender: user.gender || Gender.PILIH,
          bloodType: user.bloodType || BloodType.PILIH,
          address: user.address || '',
          phoneNumber: user.phoneNumber || '',
          email: user.email || '',
        });

        if (user.birthDate) setDate(new Date(user.birthDate));
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
    setSaving(true);
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
      toast.success('Detail user berhasil diperbarui');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Gagal memperbarui detail user');
    } finally {
      setSaving(false);
    }
  };

  const labelMap = (val: string) =>
    val === 'PILIH'
      ? '-- Pilih --'
      : val
          .replace('_', ' ')
          .toLowerCase()
          .replace(/^\w/, (c) => c.toUpperCase());

  if (loading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-[170px] w-full" />
      </div>
    );

  return (
    <Card>
      <CardContent>
        <FieldSet>
          <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Field>
                <FieldLabel>Nama Lengkap</FieldLabel>
                <Input value={identity?.fullName ?? ''} readOnly />
              </Field>

              <Field>
                <FieldLabel>NIP</FieldLabel>
                <Input value={identity?.nip ?? ''} readOnly />
              </Field>

              <Field>
                <FieldLabel>Tempat Lahir</FieldLabel>
                <Textarea
                  value={updatedData.birthPlace ?? ''}
                  onChange={(e) => handleChange('birthPlace', e.target.value)}
                />
              </Field>

              <Calendar22 value={date} onChange={setDate} label="Tanggal Lahir" />

              <Field>
                <FieldLabel>Jenis Kelamin</FieldLabel>
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
              </Field>

              <Field>
                <FieldLabel>Golongan Darah</FieldLabel>
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
              </Field>
            </div>

            <div className="space-y-4">
              <Field>
                <FieldLabel>Alamat</FieldLabel>
                <Textarea
                  value={updatedData.address ?? ''}
                  onChange={(e) => handleChange('address', e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input
                  value={updatedData.email ?? ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel>No. HP</FieldLabel>
                <Input
                  value={updatedData.phoneNumber ?? ''}
                  onChange={(e) => handleChange('phoneNumber', e.target.value)}
                />
              </Field>
            </div>
          </FieldGroup>
        </FieldSet>
      </CardContent>

      <CardFooter className="flex items-center justify-center">
        <Button onClick={handleSubmit} disabled={saving} className="w-48">
          {saving ? (
            <>
              <Spinner />
              Menyimpan...
            </>
          ) : (
            'Simpan Perubahan'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
