'use client';

import { useState } from 'react';
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
import { Calendar01 } from '@/components/calendar/calendar-01';
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

  const { data: juzList } = useSWR('/api/juz', fetcher);
  const { data: surahList } = useSWR('/api/surah', fetcher);
  const { data: academic } = useSWR('/api/academicSetting', fetcher);

  const resetForm = () => {
    setDate(new Date());
    setJuzId('');
    setSurahId('');
    setStartVerse('');
    setEndVerse('');
    setNote('');
  };

  const handleSubmit = async () => {
    if (!activityType || !date || !juzId || !surahId || !startVerse || !endVerse) {
      toast.error('Mohon lengkapi semua field yang wajib');
      return;
    }

    const payload = {
      date,
      activityType,
      juzId: juzId ? parseInt(juzId) : undefined,
      surahId: surahId ? parseInt(surahId) : undefined,
      startVerse: startVerse ? parseInt(startVerse) : undefined,
      endVerse: endVerse ? parseInt(endVerse) : undefined,
      note,
    };

    setLoading(true);
    try {
      const res = await fetch('/api/student/home-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.message);

      toast.success('Aktivitas berhasil disimpan');
      resetForm();
    } catch (error) {
      console.error('Error saving activity:', error);
      toast.error('Gagal menyimpan aktivitas');
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
            <span className="block text-sm text-muted-foreground mt-1">
              Tahun Ajaran: <b>{academic.data.currentYear}</b> - Semester:{' '}
              <b>{academic.data.currentSemester}</b>
            </span>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <FieldSet>
          <Field>
            <Calendar01 value={date} onChange={setDate} label="Tanggal Aktivitas" />
          </Field>

          <Field>
            <FieldLabel>Jenis Aktivitas</FieldLabel>
            <Select
              value={activityType}
              onValueChange={(val) => setActivityType(val as HomeActivityType)}
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
              <Select value={juzId} onValueChange={setJuzId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Juz" />
                </SelectTrigger>
                <SelectContent>
                  {juzList?.data?.map((j: Juz) => (
                    <SelectItem key={j.id} value={j.id.toString()}>
                      {j.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field className="flex-1 min-w-0">
              <FieldLabel>Surah</FieldLabel>
              <Select value={surahId} onValueChange={setSurahId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Surah" />
                </SelectTrigger>
                <SelectContent>
                  {surahList?.data?.map((s: Surah) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.name}
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
              />
            </Field>

            <Field className="flex-1 min-w-0">
              <FieldLabel>Ayat Selesai</FieldLabel>
              <Input
                type="number"
                value={endVerse}
                onChange={(e) => setEndVerse(e.target.value)}
                placeholder="7"
              />
            </Field>
          </FieldGroup>

          <Field>
            <FieldLabel>Catatan</FieldLabel>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Dilakukan setelah Subuh"
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
