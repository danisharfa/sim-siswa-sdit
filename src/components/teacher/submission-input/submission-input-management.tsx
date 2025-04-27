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
import { Loader2, Save } from 'lucide-react';

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
  id: number;
  namaSurah: string;
  jumlahAyat: number;
}

interface SurahJuz {
  id: number;
  juz: number;
  surahId: number;
  ayatAwal: number;
  ayatAkhir: number;
}

interface Wafa {
  id: number;
  namaBuku: string;
}

interface FormData {
  kelompokId: string;
  siswaId: string;
  jenisSetoran: 'TAHFIDZ' | 'TAHSIN_WAFA' | 'TAHSIN_ALQURAN';
  statusSetoran: 'LULUS' | 'TIDAK_LULUS' | 'MENGULANG';
  adab: 'BAIK' | 'KURANG_BAIK' | 'TIDAK_BAIK';
  catatan: string;
  juz?: number;
  surahId?: number;
  ayatMulai?: number;
  ayatSelesai?: number;
  wafaId?: number;
  halamanMulai?: number;
  halamanSelesai?: number;
}

export function SubmissionInputManagement() {
  const [kelompokList, setKelompokList] = useState<Kelompok[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [surahList, setSurahList] = useState<Surah[]>([]);
  const [surahJuzList, setSurahJuzList] = useState<SurahJuz[]>([]);
  const [wafaList, setWafaList] = useState<Wafa[]>([]);

  const [kelompokId, setKelompokId] = useState('');
  const [siswaId, setSiswaId] = useState('');
  const [jenisSetoran, setJenisSetoran] = useState<
    'TAHFIDZ' | 'TAHSIN_WAFA' | 'TAHSIN_ALQURAN'
  >('TAHFIDZ');
  const [selectedJuz, setSelectedJuz] = useState('');
  const [selectedSurahId, setSelectedSurahId] = useState('');
  const [ayatMulai, setAyatMulai] = useState('');
  const [ayatSelesai, setAyatSelesai] = useState('');
  const [selectedWafaId, setSelectedWafaId] = useState('');
  const [halamanMulai, setHalamanMulai] = useState('');
  const [halamanSelesai, setHalamanSelesai] = useState('');
  const [statusSetoran, setStatusSetoran] = useState<
    'LULUS' | 'TIDAK_LULUS' | 'MENGULANG'
  >('LULUS');
  const [adab, setAdab] = useState<'BAIK' | 'KURANG_BAIK' | 'TIDAK_BAIK'>(
    'BAIK'
  );
  const [catatan, setCatatan] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupRes, surahRes, surahJuzRes, wafaRes] = await Promise.all([
          fetch('/api/teacher/group'),
          fetch('/api/surah'),
          fetch('/api/surahJuz'),
          fetch('/api/wafa'),
        ]);

        const groupData = await groupRes.json();
        const surahData = await surahRes.json();
        const surahJuzData = await surahJuzRes.json();
        const wafaData = await wafaRes.json();

        if (groupData.success) setKelompokList(groupData.data);
        if (surahData.success) setSurahList(surahData.data);
        if (surahJuzData.success) setSurahJuzList(surahJuzData.data);
        if (wafaData.success) setWafaList(wafaData.data);
      } catch (error) {
        console.error('Gagal mengambil data:', error);
        toast.error('Gagal mengambil data');
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!kelompokId) return;
    const fetchMembers = async () => {
      try {
        const res = await fetch(`/api/teacher/group/${kelompokId}/member`);
        const resData = await res.json();
        if (resData.success) setSiswaList(resData.data);
      } catch (error) {
        console.error('Gagal mengambil siswa:', error);
        toast.error('Gagal mengambil siswa');
      }
    };
    fetchMembers();
  }, [kelompokId]);

  const handleSubmit = async () => {
    if (!kelompokId || !siswaId || !jenisSetoran) {
      toast.error('Lengkapi semua field terlebih dahulu');
      return;
    }

    const formData: FormData = {
      kelompokId,
      siswaId,
      jenisSetoran,
      statusSetoran,
      adab,
      catatan,
      ...(jenisSetoran === 'TAHFIDZ' || jenisSetoran === 'TAHSIN_ALQURAN'
        ? {
            juz: selectedJuz ? parseInt(selectedJuz) : undefined,
            surahId: selectedSurahId ? parseInt(selectedSurahId) : undefined,
            ayatMulai: ayatMulai ? parseInt(ayatMulai) : undefined,
            ayatSelesai: ayatSelesai ? parseInt(ayatSelesai) : undefined,
          }
        : {
            wafaId: selectedWafaId ? parseInt(selectedWafaId) : undefined,
            halamanMulai: halamanMulai ? parseInt(halamanMulai) : undefined,
            halamanSelesai: halamanSelesai
              ? parseInt(halamanSelesai)
              : undefined,
          }),
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
        throw new Error(resData.message);
      }

      toast.success('Setoran berhasil ditambahkan!');
      resetForm();
    } catch (error) {
      console.error('Gagal submit:', error);
      toast.error('Gagal submit setoran');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSiswaId('');
    setSelectedJuz('');
    setSelectedSurahId('');
    setAyatMulai('');
    setAyatSelesai('');
    setSelectedWafaId('');
    setHalamanMulai('');
    setHalamanSelesai('');
    setCatatan('');
  };

  const filteredSurahJuz = surahJuzList.filter(
    (s) => s.juz.toString() === selectedJuz
  );

  const getSurahName = (surahId: number) => {
    const surah = surahList.find((s) => s.id === surahId);
    return surah ? surah.namaSurah : 'Surah tidak ditemukan';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Input Setoran</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Pilih Kelompok */}
          <div>
            <Label>Kelompok</Label>
            <Select value={kelompokId} onValueChange={setKelompokId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Kelompok" />
              </SelectTrigger>
              <SelectContent>
                {kelompokList.map((k) => (
                  <SelectItem key={k.id} value={k.id}>
                    {k.namaKelompok} - {k.kelas.namaKelas} (
                    {k.kelas.tahunAjaran})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pilih Siswa */}
          <div>
            <Label>Siswa</Label>
            <Select value={siswaId} onValueChange={setSiswaId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Siswa" />
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
        </div>

        {/* Jenis Setoran */}
        <div>
          <Label>Jenis Setoran</Label>
          <Select
            value={jenisSetoran}
            onValueChange={(val) => setJenisSetoran(val as typeof jenisSetoran)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih Jenis Setoran" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={'TAHFIDZ'}>TAHFIDZ</SelectItem>
              <SelectItem value={'TAHSIN_WAFA'}>TAHSIN WAFA</SelectItem>
              <SelectItem value={'TAHSIN_ALQURAN'}>TAHSIN AL-QURAN</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tampilkan opsi berdasarkan Jenis Setoran */}
        {jenisSetoran === 'TAHFIDZ' || jenisSetoran === 'TAHSIN_ALQURAN' ? (
          <div className="flex flex-col lg:flex-row gap-6">
            <div>
              <Label>Juz</Label>
              <Select value={selectedJuz} onValueChange={setSelectedJuz}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Juz" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(
                    new Set(surahJuzList.map((s) => s.juz.toString()))
                  ).map((j) => (
                    <SelectItem key={j} value={j}>
                      Juz {j}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Surah</Label>
              <Select
                value={selectedSurahId}
                onValueChange={setSelectedSurahId}
                disabled={!selectedJuz}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Surah" />
                </SelectTrigger>
                <SelectContent>
                  {filteredSurahJuz.map((s) => (
                    <SelectItem key={s.surahId} value={s.surahId.toString()}>
                      {getSurahName(s.surahId)}
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
                min={1}
              />
            </div>

            <div>
              <Label>Ayat Selesai</Label>
              <Input
                type="number"
                value={ayatSelesai}
                onChange={(e) => setAyatSelesai(e.target.value)}
                min={1}
              />
            </div>
          </div>
        ) : (
          jenisSetoran === 'TAHSIN_WAFA' && (
            <div className="flex flex-col lg:flex-row gap-6">
              <div>
                <Label>Wafa</Label>
                <Select
                  value={selectedWafaId}
                  onValueChange={setSelectedWafaId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Wafa" />
                  </SelectTrigger>
                  <SelectContent>
                    {wafaList.map((w) => (
                      <SelectItem key={w.id} value={w.id.toString()}>
                        {w.namaBuku}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Halaman Mulai</Label>
                <Input
                  type="number"
                  value={halamanMulai}
                  onChange={(e) => setHalamanMulai(e.target.value)}
                  min={1}
                />
              </div>

              <div>
                <Label>Halaman Selesai</Label>
                <Input
                  type="number"
                  value={halamanSelesai}
                  onChange={(e) => setHalamanSelesai(e.target.value)}
                  min={1}
                />
              </div>
            </div>
          )
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Status Setoran */}
          <div>
            <Label>Status Setoran</Label>
            <Select
              value={statusSetoran}
              onValueChange={(val) =>
                setStatusSetoran(val as typeof statusSetoran)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LULUS">LULUS</SelectItem>
                <SelectItem value="TIDAK_LULUS">TIDAK LULUS</SelectItem>
                <SelectItem value="MENGULANG">MENGULANG</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Adab */}
          <div>
            <Label>Adab</Label>
            <Select
              value={adab}
              onValueChange={(val) => setAdab(val as typeof adab)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Adab" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BAIK">BAIK</SelectItem>
                <SelectItem value="KURANG_BAIK">KURANG BAIK</SelectItem>
                <SelectItem value="TIDAK_BAIK">TIDAK BAIK</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Catatan */}
        <div>
          <Label>Catatan</Label>
          <Textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Masukkan catatan"
          />
        </div>

        {/* Submit Button */}
        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Menyimpan setoran...
            </>
          ) : (
            <>
              <Save />
              Simpan Setoran
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
