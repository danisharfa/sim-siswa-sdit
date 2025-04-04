'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function UserDetail({ userId }: { userId: string }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatedData, setUpdatedData] = useState<any>({}); // Store updated values here

  const [date, setDate] = useState<Date>();

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(`/api/users/${userId}`);
        if (!res.ok) throw new Error('User not found');
        const data = await res.json();
        setUser(data);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [userId]);

  const handleChange = (field: string, value: string) => {
    setUpdatedData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
      } else {
        console.error('Error updating user');
      }
    } catch (error) {
      console.error('Error submitting update:', error);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>User not found.</p>;

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
            />
          )}

          <div className="grid w-full gap-9">
            {/* Nama Lengkap */}
            <div>
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                value={updatedData.namaLengkap || user.namaLengkap || ''}
                onChange={(e) => handleChange('namaLengkap', e.target.value)}
                placeholder={user.namaLengkap || 'Masukkan Nama Lengkap'}
              />
            </div>

            {/* NIS/NIP */}
            <div>
              <Label htmlFor="nis-nip">NIS/NIP</Label>
              <Input
                id="nis-nip"
                value={user.siswaProfile?.nis || user.guruProfile?.nip || '-'}
                readOnly
              />
            </div>

            {/* Tanggal Lahir */}
            <div>
              <Label htmlFor="tanggalLahir">Tanggal Lahir</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-[240px] justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon />
                    {date ? format(date, 'PPP') : <span>Pick a date</span>}
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
              <Input
                id="tempatLahir"
                value={updatedData.tempatLahir || user.tempatLahir || ''}
                onChange={(e) => handleChange('tempatLahir', e.target.value)}
                placeholder={user.tempatLahir || 'Masukkan Tempat Lahir'}
              />
            </div>

            {/* Jenis Kelamin */}
            <div>
              <Label htmlFor="jenisKelamin">Jenis Kelamin</Label>
              <Select
                onValueChange={(value) => handleChange('jenisKelamin', value)}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={user.jenisKelamin || 'Pilih Jenis Kelamin'}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                  <SelectItem value="Perempuan">Perempuan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Golongan Darah */}
            <div>
              <Label htmlFor="golonganDarah">Golongan Darah</Label>
              <Select
                onValueChange={(value) => handleChange('golonganDarah', value)}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={user.golonganDarah || 'Pilih Golongan Darah'}
                  />
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
                value={updatedData.agama || user.agama || ''}
                onChange={(e) => handleChange('agama', e.target.value)}
                placeholder={user.agama || 'Masukkan Agama'}
              />
            </div>

            {/* Alamat */}
            <div>
              <Label htmlFor="alamat">Alamat</Label>
              <Input
                id="alamat"
                value={updatedData.alamat || user.alamat || ''}
                onChange={(e) => handleChange('alamat', e.target.value)}
                placeholder={user.alamat || 'Masukkan Alamat'}
              />
            </div>

            {/* No. HP */}
            <div>
              <Label htmlFor="noHp">No. HP</Label>
              <Input
                id="noHp"
                value={updatedData.noHp || user.noHp || ''}
                onChange={(e) => handleChange('noHp', e.target.value)}
                placeholder={user.noHp || 'Masukkan No. HP'}
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user.email} readOnly />
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
