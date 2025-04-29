'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
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
import { toast } from 'sonner';
import { DatePicker } from '@/components/ui/date-picker';

type TeacherProfile = {
  namaLengkap?: string;
  nis?: string;
  tanggalLahir?: string;
  tempatLahir?: string;
  jenisKelamin?: string;
  golonganDarah?: string;
  alamat?: string;
  noTelp?: string;
  email?: string;
};

type User = {
  role: string;
  fotoProfil?: string;
  namaLengkap?: string;
  profile?: {
    nip?: string;
    tempatLahir?: string;
    jenisKelamin?: string;
    golonganDarah?: string;
    alamat?: string;
    noTelp?: string;
    email?: string;
    tanggalLahir?: string;
  };
};

export default function TeacherProfileDetail({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedData, setUpdatedData] = useState<TeacherProfile>({});
  const [date, setDate] = useState<Date | undefined>(
    user?.profile?.tanggalLahir ? new Date(user.profile.tanggalLahir) : undefined
  );

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(`/api/users/detail/${userId}`);
        if (!res.ok) throw new Error('User not found');
        const data = await res.json();

        // Ambil profile berdasarkan role
        const profile = data.role === 'teacher' ? data.guruProfile : null;

        setUser({ ...data, profile });
        setUpdatedData({
          namaLengkap: data.namaLengkap || '',
          nis: profile?.nis || '',
          tempatLahir: profile?.tempatLahir || '',
          jenisKelamin: profile?.jenisKelamin || '',
          golonganDarah: profile?.golonganDarah || '',
          alamat: profile?.alamat || '',
          noTelp: profile?.noTelp || '',
          email: profile?.email || '',
        });

        if (profile?.tanggalLahir) {
          setDate(new Date(profile.tanggalLahir));
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
          tanggalLahir: date?.toISOString() ?? user.profile?.tanggalLahir,
        }),
      });

      if (res.ok) {
        toast.success('Detail user berhasil diperbarui!');
        const detailRes = await fetch(`/api/users/detail/${userId}`);
        const detailData = await detailRes.json();
        setUser(detailData);
      } else {
        toast.error('Gagal memperbarui detail user!');
      }
    } catch (error) {
      toast.error('Gagal memperbarui detail user!');
      console.error('Error updating user:', error);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>User not found</p>;

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Pribadi</h2>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-x-4">
          {/* Foto Profil */}
          {user.fotoProfil && (
            <div className="flex justify-center">
              <Image
                src={user.fotoProfil}
                alt="Foto Profil"
                className="w-32 h-32 rounded-full object-cover"
                width={128}
                height={128}
              />
            </div>
          )}

          {/* Grid dua kolom */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Kolom kiri */}
            <div className="space-y-4">
              {/* Nama Lengkap */}
              <div>
                <Label className="py-2" htmlFor="namaLengkap">
                  Nama Lengkap
                </Label>
                <Input id="namaLengkap" value={user.namaLengkap ?? ''} readOnly />
              </div>

              {/* NIS */}
              <div>
                <Label className="py-2" htmlFor="nip">
                  NIP
                </Label>
                <Input id="nip" value={user.profile?.nip ?? ''} readOnly />
              </div>

              {/* Tempat Lahir */}
              <div>
                <Label className="py-2" htmlFor="tempatLahir">
                  Tempat Lahir
                </Label>
                <Textarea
                  id="tempatLahir"
                  value={updatedData.tempatLahir ?? ''}
                  onChange={(e) => handleChange('tempatLahir', e.target.value)}
                />
              </div>

              {/* Tanggal Lahir */}
              <div>
                <Label className="py-2" htmlFor="tanggalLahir">
                  Tanggal Lahir
                </Label>
                <DatePicker value={date} onChange={setDate} />
              </div>

              {/* Jenis Kelamin */}
              <div>
                <Label className="py-2" htmlFor="jenisKelamin">
                  Jenis Kelamin
                </Label>
                <Select
                  value={updatedData.jenisKelamin ?? ''}
                  onValueChange={(val) => handleChange('jenisKelamin', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Jenis Kelamin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LAKI_LAKI">Laki-laki</SelectItem>
                    <SelectItem value="PEREMPUAN">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Golongan Darah */}
              <div>
                <Label className="py-2" htmlFor="golonganDarah">
                  Golongan Darah
                </Label>
                <Select
                  value={updatedData.golonganDarah ?? ''}
                  onValueChange={(val) => handleChange('golonganDarah', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Golongan Darah" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="AB">AB</SelectItem>
                    <SelectItem value="O">O</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Kolom kanan */}
            <div className="space-y-4">
              {/* Alamat */}
              <div>
                <Label className="py-2" htmlFor="alamat">
                  Alamat
                </Label>
                <Textarea
                  id="alamat"
                  value={updatedData.alamat ?? ''}
                  onChange={(e) => handleChange('alamat', e.target.value)}
                />
              </div>

              {/* Email */}
              <div>
                <Label className="py-2" htmlFor="email">
                  Email
                </Label>
                <Input
                  id="email"
                  value={updatedData.email ?? ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                />
              </div>

              {/* No Telp */}
              <div>
                <Label className="py-2" htmlFor="noTelp">
                  No. HP
                </Label>
                <Input
                  id="noTelp"
                  value={updatedData.noTelp ?? ''}
                  onChange={(e) => handleChange('noTelp', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-center">
        <Button onClick={handleSubmit}>Update Data</Button>
      </CardFooter>
    </Card>
  );
}
