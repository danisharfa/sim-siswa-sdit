'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import { SubmissionType } from '@prisma/client';
import { DateRange } from 'react-day-picker';
import { DatePickerWithRange } from '@/components/ui/date-picker-range';

interface SurahJuz {
  id: number;
  juzId: number;
  startVerse: number;
  endVerse: number;
  surah: {
    id: number;
    name: string;
    verseCount: number;
  };
  juz: {
    id: number;
    name: string;
  };
}

interface Wafa {
  id: number;
  name: string;
}

interface TargetFormProps {
  studentId: string;
  onSubmit: () => void;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function TargetForm({ studentId, onSubmit }: TargetFormProps) {
  const [type, setType] = useState<SubmissionType>('TAHFIDZ');
  const [description, setDescription] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [juzList, setJuzList] = useState<{ id: number; name: string }[]>([]);
  const [startJuzId, setStartJuzId] = useState('');
  const [endJuzId, setEndJuzId] = useState('');
  const [surahJuzList, setSurahJuzList] = useState<SurahJuz[]>([]);
  const [wafaList, setWafaList] = useState<Wafa[]>([]);

  const [surahStartId, setSurahStartId] = useState('');
  const [surahEndId, setSurahEndId] = useState('');
  const [startAyat, setStartAyat] = useState('');
  const [endAyat, setEndAyat] = useState('');
  const [wafaId, setWafaId] = useState('');
  const [startPage, setStartPage] = useState('');
  const [endPage, setEndPage] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: academicSetting } = useSWR('/api/academicSetting', fetcher);

  useEffect(() => {
    const fetchData = async () => {
      const [juzRes, surahJuzRes, wafaRes] = await Promise.all([
        fetch('/api/juz'),
        fetch('/api/surahJuz'),
        fetch('/api/wafa'),
      ]);
      const [juzData, surahJuzData, wafaData] = await Promise.all([
        juzRes.json(),
        surahJuzRes.json(),
        wafaRes.json(),
      ]);

      if (juzData.success) setJuzList(juzData.data);
      if (surahJuzData.success) setSurahJuzList(surahJuzData.data);
      if (wafaData.success) setWafaList(wafaData.data);
    };
    fetchData();
  }, []);

  const filteredSurahStart = surahJuzList
    .filter((s) => s.juzId.toString() === startJuzId)
    .sort((a, b) => a.surah.id - b.surah.id);

  const filteredSurahEnd = surahJuzList
    .filter((s) => s.juzId.toString() === endJuzId)
    .sort((a, b) => a.surah.id - b.surah.id);

  const resetForm = () => {
    setType('TAHFIDZ');
    setDescription('');
    setDateRange(undefined);
    setStartJuzId('');
    setEndJuzId('');
    setSurahStartId('');
    setSurahEndId('');
    setStartAyat('');
    setEndAyat('');
    setWafaId('');
    setStartPage('');
    setEndPage('');
  };

  const handleSubmit = async () => {
    if (!academicSetting?.data) return;
    if (!dateRange?.from || !dateRange?.to) {
      toast.error('Silakan pilih tanggal awal dan akhir target');
      return;
    }

    const payload = {
      studentId,
      academicYear: academicSetting.data.currentYear,
      semester: academicSetting.data.currentSemester,
      type,
      description,
      startDate: dateRange.from,
      endDate: dateRange.to,
      surahStartId: type !== SubmissionType.TAHSIN_WAFA ? parseInt(surahStartId) || null : null,
      surahEndId: type !== SubmissionType.TAHSIN_WAFA ? parseInt(surahEndId) || null : null,
      startAyat: type !== SubmissionType.TAHSIN_WAFA ? parseInt(startAyat) || null : null,
      endAyat: type !== SubmissionType.TAHSIN_WAFA ? parseInt(endAyat) || null : null,
      wafaId: type === SubmissionType.TAHSIN_WAFA ? parseInt(wafaId) || null : null,
      startPage: type === SubmissionType.TAHSIN_WAFA ? parseInt(startPage) || null : null,
      endPage: type === SubmissionType.TAHSIN_WAFA ? parseInt(endPage) || null : null,
    };

    setLoading(true);
    try {
      const res = await fetch('/api/teacher/weekly-target', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const resData = await res.json();

      if (!resData.success) throw new Error(resData.message);
      toast.success('Target berhasil disimpan');
      resetForm();
      onSubmit();
    } catch {
      toast.error('Gagal menyimpan target');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Target Setoran</CardTitle>
        <CardDescription>
          {academicSetting?.data && (
            <span className="text-sm text-muted-foreground">
              Tahun Ajaran: <strong>{academicSetting.data.currentYear}</strong> — Semester:{' '}
              <strong>{academicSetting.data.currentSemester}</strong>
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tanggal Target */}
        <div>
          <Label className="mb-2 block">Tanggal Target</Label>
          <DatePickerWithRange value={dateRange} onChange={setDateRange} />
        </div>

        {/* Jenis Setoran */}
        <div>
          <Label className="mb-2 block">Jenis Setoran</Label>
          <Select value={type} onValueChange={(v) => setType(v as SubmissionType)}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih jenis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SubmissionType.TAHFIDZ}>Tahfidz</SelectItem>
              <SelectItem value={SubmissionType.TAHSIN_WAFA}>Tahsin (Wafa)</SelectItem>
              <SelectItem value={SubmissionType.TAHSIN_ALQURAN}>Tahsin (Al-Quran)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bagian Juz dan Surah (tanpa grid, pakai flex column) */}
        {(type === SubmissionType.TAHFIDZ || type === SubmissionType.TAHSIN_ALQURAN) && (
          <div className="flex flex-col space-y-4">
            {/* Juz Awal dan Juz Akhir */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Juz Awal */}
              <div className="flex-1 min-w-0">
                <Label className="mb-2 block">Juz Awal</Label>
                <Select value={startJuzId} onValueChange={setStartJuzId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Juz Awal" />
                  </SelectTrigger>
                  <SelectContent>
                    {juzList.map((j) => (
                      <SelectItem key={j.id} value={j.id.toString()}>
                        {j.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Juz Akhir */}
              <div className="flex-1 min-w-0">
                <Label className="mb-2 block">Juz Akhir</Label>
                <Select value={endJuzId} onValueChange={setEndJuzId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Juz Akhir" />
                  </SelectTrigger>
                  <SelectContent>
                    {juzList.map((j) => (
                      <SelectItem key={j.id} value={j.id.toString()}>
                        {j.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Surah Awal dan Surah Akhir */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Surah Awal */}
              <div className="flex-1 min-w-0">
                <Label className="mb-2 block">Surah Awal</Label>
                <Select value={surahStartId} onValueChange={setSurahStartId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Surah Awal" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSurahStart.map((s) => (
                      <SelectItem key={s.surah.id} value={s.surah.id.toString()}>
                        {s.surah.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Surah Akhir */}
              <div className="flex-1 min-w-0">
                <Label className="mb-2 block">Surah Akhir</Label>
                <Select value={surahEndId} onValueChange={setSurahEndId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Surah Akhir" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSurahEnd.map((s) => (
                      <SelectItem key={s.surah.id} value={s.surah.id.toString()}>
                        {s.surah.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Ayat */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 min-w-0">
                <Label className="mb-2 block">Ayat Awal</Label>
                <Input
                  type="number"
                  value={startAyat}
                  onChange={(e) => setStartAyat(e.target.value)}
                  placeholder="1"
                />
              </div>
              <div className="flex-1 min-w-0">
                <Label className="mb-2 block">Ayat Akhir</Label>
                <Input
                  type="number"
                  value={endAyat}
                  onChange={(e) => setEndAyat(e.target.value)}
                  placeholder="1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Wafa dan Halaman (tanpa grid, pakai flex column) */}
        {type === SubmissionType.TAHSIN_WAFA && (
          <div className="flex flex-col space-y-4">
            {/* Materi Wafa */}
            <div className="flex-1 min-w-0">
              <Label className="mb-2 block">Materi Wafa</Label>
              <Select value={wafaId} onValueChange={setWafaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Wafa" />
                </SelectTrigger>
                <SelectContent>
                  {wafaList.map((w) => (
                    <SelectItem key={w.id} value={w.id.toString()}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Halaman Mulai dan Selesai */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Halaman Mulai */}
              <div className="flex-1 min-w-0">
                <Label className="mb-2 block">Halaman Mulai</Label>
                <Input
                  type="number"
                  value={startPage}
                  onChange={(e) => setStartPage(e.target.value)}
                  placeholder="1"
                />
              </div>
              {/* Halaman Selesai */}
              <div className="flex-1 min-w-0">
                <Label className="mb-2 block">Halaman Selesai</Label>
                <Input
                  type="number"
                  value={endPage}
                  onChange={(e) => setEndPage(e.target.value)}
                  placeholder="1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Deskripsi */}
        <div>
          <Label className="mb-2 block">Deskripsi</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        {/* Button */}
        <Button disabled={loading} onClick={handleSubmit} className="w-full mt-4">
          {loading ? (
            <>
              <Loader2 className="animate-spin w-4 h-4 mr-2" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Simpan Target
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
