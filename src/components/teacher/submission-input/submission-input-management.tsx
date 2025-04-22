'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Kelompok {
  id: string;
  namaKelompok: string;
  kelas: {
    namaKelas: string;
    tahunAjaran: string;
  };
}

interface Siswa {
  id: string;
  user: {
    namaLengkap: string;
  };
}

interface FormData {
  kelompokId: string;
  siswaId: string;
  surahId: number;
  ayatMulai: number;
  ayatSelesai: number;
  jenisSetoran: 'TAHFIDZ' | 'TAHSIN';
  statusSetoran: 'LULUS' | 'TIDAK_LULUS' | 'MENGULANG';
  adab: 'BAIK' | 'KURANG_BAIK' | 'TIDAK_BAIK';
  catatan: string;
}

export function SubmissionInputManagement() {
  const [data, setData] = useState<Kelompok[]>([]);
  const [kelompokId, setKelompokId] = useState<string>('');
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [siswaId, setSiswaId] = useState<string>('');
  const [surahId, setSurahId] = useState<string>('');
  const [ayatMulai, setAyatMulai] = useState<string>('');
  const [ayatSelesai, setAyatSelesai] = useState<string>('');
  const [jenisSetoran, setJenisSetoran] = useState<'TAHFIDZ' | 'TAHSIN'>(
    'TAHFIDZ'
  );
  const [adab, setAdab] = useState<'BAIK' | 'KURANG_BAIK' | 'TIDAK_BAIK'>(
    'BAIK'
  );
  const [statusSetoran, setStatusSetoran] = useState<
    'LULUS' | 'TIDAK_LULUS' | 'MENGULANG'
  >('LULUS');
  const [catatan, setCatatan] = useState<string>('');
  const [loading, setLoading] = useState(false);

  async function fetchGroups() {
    try {
      const res = await fetch('/api/group/teacher');
      const resData = await res.json();
      if (resData.success) {
        setData(resData.data);
      }
    } catch (error) {
      console.error('Gagal mengambil data kelompok:', error);
      toast.error('Gagal mengambil data kelompok');
    }
  }

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (!kelompokId) return;
    fetch(`/api/group/${kelompokId}/member`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setSiswaList(json.data);
        } else {
          toast.error(json.error || 'Gagal mengambil anggota kelompok');
        }
      });
  }, [kelompokId]);

  const handleSubmit = async () => {
    if (!kelompokId || !siswaId || !surahId || !ayatMulai || !ayatSelesai) {
      toast.message('Semua field harus diisi');
      return;
    }

    setLoading(true);

    const formData: FormData = {
      kelompokId,
      siswaId,
      surahId: parseInt(surahId),
      ayatMulai: parseInt(ayatMulai),
      ayatSelesai: parseInt(ayatSelesai),
      jenisSetoran,
      statusSetoran,
      adab,
      catatan,
    };

    try {
      const res = await fetch('/api/submission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const resData = await res.json();

      if (!resData.success) {
        toast.message(resData.message || 'Gagal menambahkan setoran');
        throw new Error('Submission not successful');
      }

      toast.success('Setoran berhasil ditambahkan!');
      setSiswaId('');
      setSurahId('');
      setAyatMulai('');
      setAyatSelesai('');
      setCatatan('');
    } catch (error) {
      console.error('Error during submission:', error);
      toast.error('Terjadi kesalahan saat menyimpan setoran');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Input Setoran</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Pilih Kelompok</Label>
          <Select value={kelompokId} onValueChange={setKelompokId}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih kelompok" />
            </SelectTrigger>
            <SelectContent>
              {data.map((k) => (
                <SelectItem key={k.id} value={k.id}>
                  {k.namaKelompok} - {k.kelas.namaKelas} ({k.kelas.tahunAjaran})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Pilih Siswa</Label>
          <Select
            value={siswaId}
            onValueChange={setSiswaId}
            disabled={!kelompokId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih siswa" />
            </SelectTrigger>
            <SelectContent>
              {siswaList.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.user.namaLengkap}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Jenis Setoran</Label>
          <Select
            value={jenisSetoran}
            onValueChange={(value) =>
              setJenisSetoran(value as 'TAHFIDZ' | 'TAHSIN')
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TAHFIDZ">Tahfidz</SelectItem>
              <SelectItem value="TAHSIN">Tahsin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label>Surah ID</Label>
            <Input
              type="number"
              value={surahId}
              onChange={(e) => setSurahId(e.target.value)}
            />
          </div>
          <div>
            <Label>Ayat Mulai</Label>
            <Input
              type="number"
              value={ayatMulai}
              onChange={(e) => setAyatMulai(e.target.value)}
            />
          </div>
          <div>
            <Label>Ayat Selesai</Label>
            <Input
              type="number"
              value={ayatSelesai}
              onChange={(e) => setAyatSelesai(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2">
          <div>
            <Label>Adab</Label>
            <Select
              value={adab}
              onValueChange={(value) =>
                setAdab(value as 'BAIK' | 'KURANG_BAIK' | 'TIDAK_BAIK')
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BAIK">Baik</SelectItem>
                <SelectItem value="KURANG_BAIK">Kurang Baik</SelectItem>
                <SelectItem value="TIDAK_BAIK">Tidak Baik</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Status</Label>
            <Select
              value={statusSetoran}
              onValueChange={(value) =>
                setStatusSetoran(value as 'LULUS' | 'TIDAK_LULUS' | 'MENGULANG')
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LULUS">Lulus</SelectItem>
                <SelectItem value="TIDAK_LULUS">Tidak Lulus</SelectItem>
                <SelectItem value="MENGULANG">Mengulang</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="catatan">Catatan</Label>
          <Textarea
            id="catatan"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
          />
        </div>

        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Menginput setoran...' : 'Input Setoran'}
        </Button>
      </CardContent>
    </Card>
  );
}
