'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Calendar01 } from '@/components/calendar/calendar-01';
import { HomeActivityType } from '@prisma/client';

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

      toast.success('Aktivitas berhasil disimpan!');
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
        <CardDescription>Silakan isi aktivitas harian Anda</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Calendar01 value={date} onChange={setDate} label="Tanggal Setoran" />

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 min-w-0">
            <Label className="mb-2 block">Jenis Aktivitas</Label>
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
          </div>

          <div className="flex-1 min-w-0">
            <Label className="mb-2 block">Juz</Label>
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
          </div>

          <div className="flex-1 min-w-0">
            <Label className="mb-2 block">Surah</Label>
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
          </div>

          <div className="flex-1 min-w-0">
            <Label className="mb-2 block">Ayat Mulai</Label>
            <Input
              type="number"
              value={startVerse}
              onChange={(e) => setStartVerse(e.target.value)}
              placeholder="1"
            />
          </div>

          <div className="flex-1 min-w-0">
            <Label className="mb-2 block">Ayat Selesai</Label>
            <Input
              type="number"
              value={endVerse}
              onChange={(e) => setEndVerse(e.target.value)}
              placeholder="7"
            />
          </div>
        </div>

        <div>
          <Label className="mb-2 block">Catatan</Label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Contoh: Dilakukan setelah Subuh"
            className="min-h-24"
          />
        </div>

        <Button onClick={handleSubmit} disabled={loading} className="w-full mt-6">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Simpan Aktivitas
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
