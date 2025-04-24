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

interface Surah {
  id: string;
  nama: string;
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
  const [kelompokId, setKelompokId] = useState('');
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [siswaId, setSiswaId] = useState('');
  const [surahList, setSurahList] = useState<Surah[]>([]);
  const [selectedSurahId, setSelectedSurahId] = useState('');
  const [selectedJuz, setSelectedJuz] = useState('');
  const [ayatMulai, setAyatMulai] = useState('');
  const [ayatSelesai, setAyatSelesai] = useState('');
  const [jenisSetoran, setJenisSetoran] = useState<'TAHFIDZ' | 'TAHSIN'>(
    'TAHFIDZ'
  );
  const [adab, setAdab] = useState<'BAIK' | 'KURANG_BAIK' | 'TIDAK_BAIK'>(
    'BAIK'
  );
  const [statusSetoran, setStatusSetoran] = useState<
    'LULUS' | 'TIDAK_LULUS' | 'MENGULANG'
  >('LULUS');
  const [catatan, setCatatan] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchGroups = async () => {
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
    };
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

  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        const response = await fetch('/api/surah');
        const data = await response.json();
        setSurahList(data);
      } catch (error) {
        console.error('Gagal mengambil daftar surah:', error);
        toast.error('Gagal mengambil daftar surah');
      }
    };
    fetchSurahs();
  }, []);

  const handleSubmit = async () => {
    if (
      !kelompokId ||
      !siswaId ||
      !selectedSurahId ||
      !ayatMulai ||
      !ayatSelesai
    ) {
      toast.message('Semua field harus diisi');
      return;
    }

    const formData: FormData = {
      kelompokId,
      siswaId,
      surahId: parseInt(selectedSurahId),
      ayatMulai: parseInt(ayatMulai),
      ayatSelesai: parseInt(ayatSelesai),
      jenisSetoran,
      statusSetoran,
      adab,
      catatan,
    };

    setLoading(true);
    try {
      const res = await fetch('/api/submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const resData = await res.json();

      if (!resData.success) {
        toast.message(resData.message || 'Gagal menambahkan setoran');
        throw new Error('Submission not successful');
      }

      toast.success('Setoran berhasil ditambahkan!');
      setSiswaId('');
      setSelectedSurahId('');
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
            onValueChange={(value: 'TAHFIDZ' | 'TAHSIN') =>
              setJenisSetoran(value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih jenis setoran" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TAHFIDZ">Tahfidz</SelectItem>
              <SelectItem value="TAHSIN">Tahsin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <div>
            <Label>Juz</Label>
            <Select value={selectedJuz} onValueChange={setSelectedJuz}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih Juz" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 30 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    Juz {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Surah</Label>
            <Select value={selectedSurahId} onValueChange={setSelectedSurahId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih Surah" />
              </SelectTrigger>
              <SelectContent>
                {surahList.map((surah) => (
                  <SelectItem key={surah.id} value={surah.id}>
                    {surah.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              onValueChange={(value: 'BAIK' | 'KURANG_BAIK' | 'TIDAK_BAIK') =>
                setAdab(value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih adab" />
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
              onValueChange={(value: 'LULUS' | 'TIDAK_LULUS' | 'MENGULANG') =>
                setStatusSetoran(value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih status" />
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
