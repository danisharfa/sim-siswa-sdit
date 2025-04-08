'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
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
import { CalendarIcon } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type UpdatedUserProfile = {
  namaLengkap?: string;
  nis?: string;
  nip?: string;
  tempatLahir?: string;
  jenisKelamin?: string;
  golonganDarah?: string;
  agama?: string;
  alamat?: string;
  noTelp?: string;
  email?: string;
  tanggalLahir?: string;
};

type User = {
  role: string;
  fotoProfil?: string;
  namaLengkap?: string;
  profile?: {
    nis?: string;
    nip?: string;
    tempatLahir?: string;
    jenisKelamin?: string;
    golonganDarah?: string;
    agama?: string;
    alamat?: string;
    noTelp?: string;
    email?: string;
    tanggalLahir?: string;
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
        if (!res.ok) throw new Error('User not found');
        const data = await res.json();

        // Ambil profile berdasarkan role
        const profile =
          data.role === 'student' ? data.siswaProfile : data.guruProfile;

        setUser({ ...data, profile });
        setUpdatedData({
          namaLengkap: data.namaLengkap || '',
          nis: profile?.nis || '',
          nip: profile?.nip || '',
          tempatLahir: profile?.tempatLahir || '',
          jenisKelamin: profile?.jenisKelamin || '',
          golonganDarah: profile?.golonganDarah || '',
          agama: profile?.agama || '',
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
          tanggalLahir: date?.toISOString() ?? user.profile?.tanggalLahir, // tambahkan jika pakai kalender
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
  if (!user) return <p>User not found</p>;

  const isStudent = user.role === 'student';

  return (
    <Card>
      <CardContent>
        <div className="flex flex-col space-y-4">
          {/* Foto Profil */}
          {user.fotoProfil && (
            <Image
              src={user.fotoProfil}
              alt="Foto Profil"
              className="w-32 h-32 rounded-full object-cover"
              width={128}
              height={128}
            />
          )}

          <div className="grid w-full gap-6">
            {/* Nama Lengkap */}
            <div>
              <Label htmlFor="namaLengkap">Nama Lengkap</Label>
              <Input
                id="namaLengkap"
                value={updatedData.namaLengkap}
                onChange={(e) => handleChange('namaLengkap', e.target.value)}
              />
            </div>

            {/* NIS / NIP */}
            <div>
              <Label htmlFor="nisnip">{isStudent ? 'NIS' : 'NIP'}</Label>
              <Input
                id="nisnip"
                value={isStudent ? updatedData.nis : updatedData.nip}
                onChange={(e) =>
                  handleChange(isStudent ? 'nis' : 'nip', e.target.value)
                }
              />
            </div>

            {/* Tanggal Lahir */}
            <div>
              <Label htmlFor="tanggalLahir">Tanggal Lahir</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : <span>Pilih tanggal</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Tempat Lahir */}
            <div>
              <Label htmlFor="tempatLahir">Tempat Lahir</Label>
              <Textarea
                id="tempatLahir"
                value={updatedData.tempatLahir}
                onChange={(e) => handleChange('tempatLahir', e.target.value)}
              />
            </div>

            {/* Jenis Kelamin */}
            <div>
              <Label htmlFor="jenisKelamin">Jenis Kelamin</Label>
              <Select
                value={updatedData.jenisKelamin}
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
              <Label htmlFor="golonganDarah">Golongan Darah</Label>
              <Select
                value={updatedData.golonganDarah}
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

            {/* Agama */}
            <div>
              <Label htmlFor="agama">Agama</Label>
              <Input
                id="agama"
                value={updatedData.agama}
                onChange={(e) => handleChange('agama', e.target.value)}
              />
            </div>

            {/* Alamat */}
            <div>
              <Label htmlFor="alamat">Alamat</Label>
              <Textarea
                id="alamat"
                value={updatedData.alamat}
                onChange={(e) => handleChange('alamat', e.target.value)}
              />
            </div>

            {/* No Telp */}
            <div>
              <Label htmlFor="noTelp">No. HP</Label>
              <Input
                id="noTelp"
                value={updatedData.noTelp}
                onChange={(e) => handleChange('noTelp', e.target.value)}
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={updatedData.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
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
