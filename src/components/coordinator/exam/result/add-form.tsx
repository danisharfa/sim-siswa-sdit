'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
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
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface ExamSchedule {
  id: string;
  date: string;
  sessionName: string;
  startTime: string;
  endTime: string;
}

interface StudentRequest {
  examRequestId: string;
  examScheduleId: string;
  examType: 'SURAH' | 'JUZ';
  surah?: { name: string };
  juz?: { name: string };
  student: {
    nis: string;
    user: { fullName: string };
  };
  result?: {
    score: number;
    passed: boolean;
    notes?: string;
  } | null;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function AddResultForm({ onSaved }: { onSaved: () => void }) {
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [score, setScore] = useState('');
  const [passed, setPassed] = useState<boolean | null>(null);
  const [notes, setNotes] = useState('');

  const { data: schedules } = useSWR('/api/coordinator/exam/schedule/available', fetcher);
  const { data: studentsResponse, mutate } = useSWR(
    selectedScheduleId ? `/api/coordinator/exam/result/schedule/${selectedScheduleId}` : null,
    fetcher
  );

  const students: StudentRequest[] | undefined = studentsResponse?.data;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScheduleId || !selectedRequestId || !score || passed === null) {
      toast.error('Harap lengkapi semua data');
      return;
    }

    const res = await fetch('/api/coordinator/exam/result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        examScheduleId: selectedScheduleId,
        examRequestId: selectedRequestId,
        score: Number(score),
        passed,
        notes,
      }),
    });

    const json = await res.json();
    if (json.success) {
      toast.success('Hasil ujian berhasil disimpan');
      setScore('');
      setNotes('');
      setPassed(null);
      setSelectedRequestId(null);
      onSaved();
      mutate();
    } else {
      toast.error(json.message || 'Gagal menyimpan hasil ujian');
    }
  };

  useEffect(() => {
    setSelectedRequestId(null);
    setScore('');
    setNotes('');
    setPassed(null);
  }, [selectedScheduleId]);

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Form Penilaian</h2>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Pilih Jadwal Ujian</Label>
            <Select onValueChange={setSelectedScheduleId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih sesi ujian" />
              </SelectTrigger>
              <SelectContent>
                {schedules?.data?.map((s: ExamSchedule) => (
                  <SelectItem key={s.id} value={s.id}>
                    {new Date(s.date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}{' '}
                    - {s.sessionName} ({s.startTime} - {s.endTime})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedScheduleId && students && (
            <>
              <div>
                <Label>Pilih Siswa</Label>
                <Select onValueChange={setSelectedRequestId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih siswa" />
                  </SelectTrigger>
                  <SelectContent>
                    {students
                      .filter((s) => !s.result)
                      .map((s) => (
                        <SelectItem key={s.examRequestId} value={s.examRequestId}>
                          {s.student.user.fullName} -{' '}
                          {s.examType === 'SURAH'
                            ? `Surah: ${s.surah?.name}`
                            : `Juz: ${s.juz?.name}`}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Nilai</Label>
                <Input type="number" value={score} onChange={(e) => setScore(e.target.value)} />
              </div>

              <div>
                <Label>Status Kelulusan</Label>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={passed === true ? 'default' : 'outline'}
                    onClick={() => setPassed(true)}
                  >
                    Lulus
                  </Button>
                  <Button
                    type="button"
                    variant={passed === false ? 'destructive' : 'outline'}
                    onClick={() => setPassed(false)}
                  >
                    Tidak Lulus
                  </Button>
                </div>
              </div>

              <div>
                <Label>Catatan</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>

              <Button type="submit">Simpan</Button>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
