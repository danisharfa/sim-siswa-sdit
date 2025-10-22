'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Field, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { Calendar22 } from '@/components/layout/calendar/calendar-22';
import { toast } from 'sonner';
import { Role, Gender, BloodType } from '@prisma/client';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [saving, setSaving] = useState(false);

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
          birthPlace: data.birthPlace ?? '',
          gender: data.gender ?? Gender.PILIH,
          bloodType: data.bloodType ?? BloodType.PILIH,
          address: data.address ?? '',
          email: data.email ?? '',
          phoneNumber: data.phoneNumber ?? '',
        });

        if (data.birthDate) setDate(new Date(data.birthDate));
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
    setSaving(true);
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

      const data = await res.json();
      if (!res.ok) throw new Error();

      toast.success(data.message);
    } catch {
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
        <Skeleton className="h-170 w-full" />
      </div>
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Detail Pengguna</CardTitle>
      </CardHeader>

      <CardContent>
        <FieldSet>
          <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <Field>
                <FieldLabel>Nama Lengkap</FieldLabel>
                <Input
                  value={updatedData.fullName ?? ''}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel>{role === Role.student ? 'NIS' : 'NIP'}</FieldLabel>
                <Input
                  value={role === Role.student ? updatedData.nis ?? '' : updatedData.nip ?? ''}
                  onChange={(e) =>
                    handleChange(role === Role.student ? 'nis' : 'nip', e.target.value)
                  }
                />
              </Field>

              {role === Role.student && (
                <Field>
                  <FieldLabel>NISN</FieldLabel>
                  <Input
                    value={updatedData.nisn ?? ''}
                    onChange={(e) => handleChange('nisn', e.target.value)}
                  />
                </Field>
              )}

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
                    {Object.values(BloodType).map((bt) => (
                      <SelectItem key={bt} value={bt}>
                        {labelMap(bt)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {/* Kolom kanan */}
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
