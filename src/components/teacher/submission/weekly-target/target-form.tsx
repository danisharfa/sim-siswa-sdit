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
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function TargetForm({ studentId }: TargetFormProps) {
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
      surahStartId: type === 'TAHFIDZ' ? parseInt(surahStartId) || null : null,
      surahEndId: type === 'TAHFIDZ' ? parseInt(surahEndId) || null : null,
      startAyat: type === 'TAHFIDZ' ? parseInt(startAyat) || null : null,
      endAyat: type === 'TAHFIDZ' ? parseInt(endAyat) || null : null,
      wafaId: type === 'TAHSIN_WAFA' ? parseInt(wafaId) || null : null,
      startPage: type === 'TAHSIN_WAFA' ? parseInt(startPage) || null : null,
      endPage: type === 'TAHSIN_WAFA' ? parseInt(endPage) || null : null,
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
      <CardContent className="space-y-4">
        <div>
          <Label>Tanggal Target</Label>
          <DatePickerWithRange value={dateRange} onChange={setDateRange} />
        </div>

        <div>
          <Label>Jenis Setoran</Label>
          <Select value={type} onValueChange={(v) => setType(v as SubmissionType)}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih jenis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TAHFIDZ">Tahfidz</SelectItem>
              <SelectItem value="TAHSIN_WAFA">Tahsin (Wafa)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {type === 'TAHFIDZ' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Juz Awal</Label>
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
            <div>
              <Label>Juz Akhir</Label>
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
            <div>
              <Label>Surah Awal</Label>
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
            <div>
              <Label>Surah Akhir</Label>
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
            <Input
              placeholder="Ayat Awal"
              value={startAyat}
              onChange={(e) => setStartAyat(e.target.value)}
            />
            <Input
              placeholder="Ayat Akhir"
              value={endAyat}
              onChange={(e) => setEndAyat(e.target.value)}
            />
          </div>
        )}

        {type === 'TAHSIN_WAFA' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Materi Wafa</Label>
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
            <Input
              placeholder="Halaman Awal"
              value={startPage}
              onChange={(e) => setStartPage(e.target.value)}
            />
            <Input
              placeholder="Halaman Akhir"
              value={endPage}
              onChange={(e) => setEndPage(e.target.value)}
            />
          </div>
        )}

        <div>
          <Label>Deskripsi</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <Button disabled={loading} onClick={handleSubmit} className="w-full">
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
