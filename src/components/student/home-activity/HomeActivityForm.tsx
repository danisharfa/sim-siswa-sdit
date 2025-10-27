'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { Calendar01 } from '@/components/layout/calendar/calendar-01';
import { HomeActivityType } from '@prisma/client';
import { Field, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';

interface Surah {
  id: number;
  name: string;
  verseCount: number;
}

interface Juz {
  id: number;
  name: string;
}

interface SurahJuz {
  surah: Surah;
  juz: Juz;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function HomeActivityForm() {
  const [date, setDate] = useState<Date>();
  const [activityType, setActivityType] = useState<HomeActivityType>(HomeActivityType.MURAJAAH);
  const [juzId, setJuzId] = useState('');
  const [surahId, setSurahId] = useState('');
  const [startVerse, setStartVerse] = useState('');
  const [endVerse, setEndVerse] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  // ===== SWR DATA FETCHING =====
  const { data: juzResponse } = useSWR('/api/juz', fetcher);
  const { data: surahJuzResponse } = useSWR('/api/surahJuz', fetcher);
  const { data: academic } = useSWR('/api/academicSetting', fetcher);

  // ===== COMPUTED VALUES =====
  const juzList = useMemo(() => {
    return juzResponse?.success ? juzResponse.data : [];
  }, [juzResponse]);

  const surahJuzList = useMemo(() => {
    return surahJuzResponse?.success ? surahJuzResponse.data : [];
  }, [surahJuzResponse]);

  const filteredSurahJuz = useMemo(() => {
    return surahJuzList
      .filter((s: SurahJuz) => s.juz.id.toString() === juzId)
      .sort((a: SurahJuz, b: SurahJuz) => a.surah.id - b.surah.id);
  }, [surahJuzList, juzId]);

  // ===== EVENT HANDLERS =====
  const handleJuzChange = (newJuzId: string) => {
    setJuzId(newJuzId);
    setSurahId(''); // Reset surah when juz changes
  };

  const resetForm = () => {
    setDate(new Date());
    setActivityType(HomeActivityType.MURAJAAH);
    setJuzId('');
    setSurahId('');
    setStartVerse('');
    setEndVerse('');
    setNote('');
  };

  const handleSubmit = async () => {
    // Basic validations
    if (!date) return toast.error('Tanggal aktivitas harus dipilih');
    if (!activityType) return toast.error('Jenis aktivitas harus dipilih');
    if (!juzId) return toast.error('Juz harus dipilih');
    if (!surahId) return toast.error('Surah harus dipilih');
    if (!startVerse) return toast.error('Ayat mulai harus diisi');
    if (!endVerse) return toast.error('Ayat selesai harus diisi');

    // Numeric validations
    const startVerseNum = parseInt(startVerse);
    const endVerseNum = parseInt(endVerse);

    if (isNaN(startVerseNum) || startVerseNum < 1) {
      return toast.error('Ayat mulai harus berupa angka positif');
    }
    if (isNaN(endVerseNum) || endVerseNum < 1) {
      return toast.error('Ayat selesai harus berupa angka positif');
    }
    if (startVerseNum > endVerseNum) {
      return toast.error('Ayat mulai tidak boleh lebih besar dari ayat selesai');
    }

    // Find selected surah to validate verse count
    const selectedSurahJuz = filteredSurahJuz.find(
      (sj: SurahJuz) => sj.surah.id.toString() === surahId
    );
    if (selectedSurahJuz && endVerseNum > selectedSurahJuz.surah.verseCount) {
      return toast.error(
        `Ayat selesai melebihi jumlah ayat surah (${selectedSurahJuz.surah.verseCount})`
      );
    }

    const payload = {
      date,
      activityType,
      juzId: parseInt(juzId),
      surahId: parseInt(surahId),
      startVerse: startVerseNum,
      endVerse: endVerseNum,
      note: note.trim() || null,
    };

    setLoading(true);
    try {
      const res = await fetch('/api/student/home-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        toast.error(result.message || 'Gagal menyimpan aktivitas');
        return;
      }

      toast.success('Aktivitas berhasil disimpan');
      resetForm();
    } catch (error) {
      console.error('Error saving activity:', error);
      toast.error('Terjadi kesalahan saat menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Aktivitas Rumah</CardTitle>
        <CardDescription>
          {academic?.success && (
            <span className="text-sm text-muted-foreground">
              Tahun Ajaran: <strong>{academic.data.currentYear}</strong> – Semester:{' '}
              <strong>{academic.data.currentSemester}</strong>
            </span>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <FieldSet>
          <Field>
            <Calendar01 value={date} onChange={setDate} label="Tanggal Aktivitas" />
          </Field>

          <Field>
            <FieldLabel>Jenis Aktivitas</FieldLabel>
            <Select
              value={activityType}
              onValueChange={(newType) => {
                setActivityType(newType as HomeActivityType);
                // Reset related fields when activity type changes
                setJuzId('');
                setSurahId('');
                setStartVerse('');
                setEndVerse('');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Jenis Aktivitas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MURAJAAH">Muraja&apos;ah</SelectItem>
                <SelectItem value="TILAWAH">Tilawah</SelectItem>
                <SelectItem value="TARJAMAH">Tarjamah</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <FieldGroup className="flex flex-col md:flex-row gap-4">
            <Field className="flex-1 min-w-0">
              <FieldLabel>Juz</FieldLabel>
              <Select value={juzId} onValueChange={handleJuzChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Juz" />
                </SelectTrigger>
                <SelectContent>
                  {juzList.map((j: Juz) => (
                    <SelectItem key={j.id} value={j.id.toString()}>
                      {j.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field className="flex-1 min-w-0">
              <FieldLabel>Surah</FieldLabel>
              <Select value={surahId} onValueChange={setSurahId} disabled={!juzId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Surah" />
                </SelectTrigger>
                <SelectContent>
                  {filteredSurahJuz.map((sj: SurahJuz) => (
                    <SelectItem key={sj.surah.id} value={sj.surah.id.toString()}>
                      {sj.surah.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>

          <FieldGroup className="flex flex-col md:flex-row gap-4">
            <Field className="flex-1 min-w-0">
              <FieldLabel>Ayat Mulai</FieldLabel>
              <Input
                type="number"
                value={startVerse}
                onChange={(e) => setStartVerse(e.target.value)}
                placeholder="1"
                min="1"
              />
            </Field>

            <Field className="flex-1 min-w-0">
              <FieldLabel>Ayat Selesai</FieldLabel>
              <Input
                type="number"
                value={endVerse}
                onChange={(e) => setEndVerse(e.target.value)}
                placeholder="7"
                min="1"
              />
            </Field>
          </FieldGroup>

          <Field>
            <FieldLabel>Catatan</FieldLabel>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tambahkan catatan untuk aktivitas ini..."
              className="min-h-24"
            />
          </Field>
        </FieldSet>
      </CardContent>
      <CardFooter className="flex items-center justify-center">
        <Button onClick={handleSubmit} disabled={loading} className="w-48">
          {loading ? (
            <>
              <Spinner />
              Menyimpan...
            </>
          ) : (
            <>
              <Save />
              Simpan Aktivitas
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
