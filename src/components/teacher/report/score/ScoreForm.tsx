'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { convertToLetter } from '@/lib/data/score-converter';
import { GradeLetter, TahsinType, AssessmentPeriod } from '@prisma/client';

interface ScoreFormProps {
  groupId: string;
  student: {
    userId: string;
    nis: string;
    user: { fullName: string };
    group: {
      name: string;
      classroom: {
        name: string;
        academicYear: string;
        semester: string;
      };
    } | null;
  };
}

interface TahsinEntry {
  id?: string;
  type: TahsinType;
  topic: string;
  score: number;
  grade: GradeLetter;
  description: string;
  period: AssessmentPeriod;
}

interface TahfidzEntry {
  id?: string;
  surahId: number;
  topic: string;
  score: number;
  grade: GradeLetter;
  description: string;
  period: AssessmentPeriod;
}

interface SurahJuz {
  id: number;
  juzId: number;
  startVerse: number;
  endVerse: number;
  surah: { id: number; name: string };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface ExistingScoreResponse {
  tahsin: (Omit<TahsinEntry, 'type'> & { tahsinType: TahsinType; period: AssessmentPeriod })[];
  tahfidz: (Omit<TahfidzEntry, 'topic'> & { surah: { name: string }; period: AssessmentPeriod })[];
  lastMaterial: string | null;
  averageScores: {
    tahsin: number | null;
    tahfidz: number | null;
    midTahsin: number | null;
    midTahfidz: number | null;
  };
}

export function ScoreForm({ groupId, student }: ScoreFormProps) {
  const [currentPeriod, setCurrentPeriod] = useState<AssessmentPeriod>('FINAL');
  const [tahsinEntries, setTahsinEntries] = useState<TahsinEntry[]>([]);
  const [tahfidzEntries, setTahfidzEntries] = useState<TahfidzEntry[]>([]);
  const [selectedJuz, setSelectedJuz] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastMaterial, setLastMaterial] = useState('');

  const { data: surahData } = useSWR<{ data: { id: number; name: string }[] }>(
    `/api/teacher/score/tahfidz/eligible/${student.userId}`,
    fetcher
  );
  const surahList = surahData?.data || [];

  const { data: surahJuzData } = useSWR<{ data: SurahJuz[] }>('/api/surahJuz', fetcher);
  const surahJuzList = surahJuzData?.data || [];

  const { data: existingScores, isLoading } = useSWR<ExistingScoreResponse>(
    `/api/teacher/score/${student.userId}?period=${currentPeriod}`,
    fetcher
  );

  useEffect(() => {
    if (existingScores && !isLoading) {
      if (existingScores.tahsin?.length) {
        setTahsinEntries(
          existingScores.tahsin.map((t) => ({
            id: t.id,
            type: t.tahsinType,
            topic: t.topic,
            score: t.score,
            grade: t.grade,
            description: t.description || '',
            period: t.period,
          }))
        );
      }

      if (existingScores.tahfidz?.length) {
        setTahfidzEntries(
          existingScores.tahfidz.map((score) => ({
            id: score.id,
            surahId: score.surahId,
            topic: score.surah.name,
            score: score.score,
            grade: score.grade,
            description: score.description || '',
            period: score.period,
          }))
        );
      }

      if (!lastMaterial && existingScores.lastMaterial) {
        setLastMaterial(existingScores.lastMaterial);
      }
    }
  }, [existingScores, isLoading, lastMaterial, currentPeriod]);

  function handleAddTahsin(type: TahsinType) {
    setTahsinEntries([
      ...tahsinEntries,
      {
        type,
        topic: '',
        score: 0,
        grade: 'D',
        description: '',
        period: currentPeriod,
      },
    ]);
  }

  function handleTahsinChange(index: number, field: keyof TahsinEntry, value: string | number) {
    const updated = [...tahsinEntries];

    if (field === 'score') {
      const numeric = parseInt(value as string) || 0;
      updated[index].score = numeric;
      updated[index].grade = convertToLetter(numeric);
    } else if (field === 'topic' || field === 'description') {
      updated[index][field] = value as string;
    } else if (field === 'type') {
      updated[index].type = value as TahsinType;
    }
    setTahsinEntries(updated);
  }

  function handleSetJuz(index: number, juzId: number) {
    setSelectedJuz({ ...selectedJuz, [index]: juzId });
  }

  async function handleRemoveTahsin(index: number) {
    const toDelete = tahsinEntries[index];
    const updated = [...tahsinEntries];
    updated.splice(index, 1);
    setTahsinEntries(updated);

    if (toDelete.id) {
      try {
        const res = await fetch(`/api/teacher/score/tahsin/${toDelete.id}`, {
          method: 'DELETE',
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error);
        toast.success('Nilai Tahsin berhasil dihapus');
      } catch (err) {
        const error = err as Error;
        console.error('[DELETE_TAHSIN]', error);
        toast.error(error.message || 'Gagal menghapus nilai Tahsin');
      }
    }
  }

  function handleAddTahfidz(surahId: number, topic: string) {
    if (tahfidzEntries.find((e) => e.surahId === surahId)) {
      toast.warning(`Nilai untuk surah ${topic} sudah ditambahkan`);
      return;
    }
    setTahfidzEntries([
      ...tahfidzEntries,
      { surahId, topic, score: 0, grade: 'D', description: '', period: currentPeriod },
    ]);
  }

  function handleTahfidzChange(index: number, field: keyof TahfidzEntry, value: string | number) {
    const updated = [...tahfidzEntries];

    if (field === 'score') {
      const numeric = parseInt(value as string) || 0;
      updated[index].score = numeric;
      updated[index].grade = convertToLetter(numeric);
    } else if (field === 'description') {
      updated[index].description = value as string;
    }

    setTahfidzEntries(updated);
  }

  async function handleRemoveTahfidz(index: number) {
    const toDelete = tahfidzEntries[index];
    const updated = [...tahfidzEntries];
    updated.splice(index, 1);
    setTahfidzEntries(updated);

    if (toDelete.id) {
      try {
        const res = await fetch(`/api/teacher/score/tahfidz/${toDelete.id}`, {
          method: 'DELETE',
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error);
        toast.success('Nilai Tahfidz berhasil dihapus');
      } catch (err) {
        const error = err as Error;
        console.error('[DELETE_TAHFIDZ]', error);
        toast.error(error.message || 'Gagal menghapus nilai Tahfidz');
      }
    }
  }

  async function handleSubmit() {
    if (tahsinEntries.some((entry) => !entry.topic)) {
      toast.error('Semua topik Tahsin harus diisi');
      return;
    }

    const payload = {
      studentId: student.userId,
      groupId,
      tahsin: tahsinEntries,
      tahfidz: tahfidzEntries,
      lastMaterial,
      assessmentPeriod: currentPeriod,
    };

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/teacher/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal menyimpan nilai');
      toast.success('Nilai berhasil disimpan');
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || 'Gagal menyimpan nilai');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 mt-4">
      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Periode Penilaian</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={currentPeriod}
            onValueChange={(value: AssessmentPeriod) => {
              setCurrentPeriod(value);
              setTahsinEntries([]);
              setTahfidzEntries([]);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih Periode Penilaian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MID_SEMESTER">Tengah Semester</SelectItem>
              <SelectItem value="FINAL">Akhir Semester</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      {/* Card Tahsin */}
      <Card>
        <CardHeader>
          <CardTitle>Penilaian Tahsin</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={() => handleAddTahsin('WAFA')} type="button">
              + Bahasan WAFA
            </Button>
            <Button onClick={() => handleAddTahsin('ALQURAN')} type="button">
              + Bahasan AL-QURAN
            </Button>
          </div>
          {tahsinEntries.map((entry, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-5 gap-2 border p-3 rounded-md"
            >
              <div className="col-span-1">
                {entry.type === 'WAFA' ? (
                  <Input
                    value={entry.topic}
                    onChange={(e) => handleTahsinChange(index, 'topic', e.target.value)}
                    placeholder="Bahasan WAFA"
                  />
                ) : entry.topic ? (
                  <Input disabled value={entry.topic} />
                ) : (
                  <div className="space-y-2">
                    <Select onValueChange={(val) => handleSetJuz(index, parseInt(val))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Juz" />
                      </SelectTrigger>
                      <SelectContent>
                        {[...new Set(surahJuzList.map((s) => s.juzId))].map((juzId) => (
                          <SelectItem key={juzId} value={juzId.toString()}>
                            Juz {juzId}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      onValueChange={(val) => handleTahsinChange(index, 'topic', val)}
                      disabled={!selectedJuz[index]}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Surah" />
                      </SelectTrigger>
                      <SelectContent>
                        {surahJuzList
                          .filter((s) => s.juzId === selectedJuz[index])
                          .map((sj) => (
                            <SelectItem key={sj.surah.id} value={sj.surah.name}>
                              {sj.surah.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <Input
                type="text"
                inputMode="numeric"
                value={entry.score === 0 ? '' : entry.score.toString()}
                onChange={(e) => handleTahsinChange(index, 'score', e.target.value)}
                placeholder="Nilai (0–100)"
              />
              <Input disabled value={entry.grade} />
              <Textarea
                value={entry.description}
                onChange={(e) => handleTahsinChange(index, 'description', e.target.value)}
                placeholder="Deskripsi"
              />
              <Button onClick={() => handleRemoveTahsin(index)} variant="destructive" type="button">
                Hapus
              </Button>
            </div>
          ))}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center pt-2 border-t mt-4">
            <label className="font-medium text-sm">Bacaan Terakhir</label>
            <Input
              value={lastMaterial}
              onChange={(e) => setLastMaterial(e.target.value)}
              placeholder="Contoh: Review Gharib"
            />
          </div>
        </CardContent>
      </Card>

      {/* Card Tahfidz */}
      <Card>
        <CardHeader>
          <CardTitle>Penilaian Tahfidz</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            onValueChange={(val) => {
              const surah = surahList.find((s) => s.id.toString() === val);
              if (surah) handleAddTahfidz(surah.id, surah.name);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih Surah untuk Dinilai" />
            </SelectTrigger>
            <SelectContent>
              {surahList
                .filter((s) => !tahfidzEntries.some((e) => e.surahId === s.id))
                .map((s) => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    {s.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          {tahfidzEntries.map((entry, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-5 gap-2 border p-3 rounded-md"
            >
              <Input disabled value={entry.topic} />
              <Input
                type="text"
                inputMode="numeric"
                value={entry.score === 0 ? '' : entry.score.toString()}
                onChange={(e) => handleTahfidzChange(index, 'score', e.target.value)}
                placeholder="Nilai (0–100)"
              />
              <Input disabled value={entry.grade} />
              <Textarea
                value={entry.description}
                onChange={(e) => handleTahfidzChange(index, 'description', e.target.value)}
                placeholder="Deskripsi"
              />
              <Button
                onClick={() => handleRemoveTahfidz(index)}
                variant="destructive"
                type="button"
              >
                Hapus
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Menyimpan...' : 'Simpan Penilaian'}
      </Button>
    </div>
  );
}
