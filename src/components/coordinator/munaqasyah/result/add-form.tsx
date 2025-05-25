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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface MunaqasyahSchedule {
  id: string;
  date: string;
  sessionName: string;
  startTime: string;
  endTime: string;
}

interface StudentRequest {
  requestId: string;
  scheduleId: string;
  stage: string;
  juz?: { name: string };
  student: {
    nis: string;
    user: { fullName: string };
  };
  result?: {
    passed: boolean;
    note?: string;
  } | null;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function AddResultForm({ onSaved }: { onSaved: () => void }) {
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [note, setNote] = useState('');

  const { data: schedules } = useSWR('/api/coordinator/munaqasyah/schedule/available', fetcher);
  const { data: studentsResponse, mutate } = useSWR(
    selectedScheduleId ? `/api/coordinator/munaqasyah/result/schedule/${selectedScheduleId}` : null,
    fetcher
  );

  const students: StudentRequest[] | undefined = studentsResponse?.data;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScheduleId || !selectedRequestId || score === null) {
      toast.error('Harap lengkapi semua data');
      return;
    }

    const res = await fetch('/api/coordinator/munaqasyah/result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scheduleId: selectedScheduleId,
        requestId: selectedRequestId,
        score,
        note,
      }),
    });

    const json = await res.json();
    if (json.success) {
      toast.success(json.message || 'Hasil munaqasyah berhasil disimpan');
      setSelectedRequestId(null);
      setScore(null);
      setNote('');
      onSaved();
      mutate();
    } else {
      toast.error(json.message || 'Gagal menyimpan hasil');
    }
  };

  useEffect(() => {
    setSelectedRequestId(null);
    setScore(null);
    setNote('');
  }, [selectedScheduleId]);

  const getStatusLabel = () => {
    if (score === null) return '-';
    if (score >= 91) return 'MUMTAZ (Lulus)';
    if (score >= 85) return 'JAYYID JIDDAN (Lulus)';
    if (score >= 80) return 'JAYYID (Lulus)';
    return 'TIDAK LULUS';
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Form Penilaian Munaqasyah</h2>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Pilih Jadwal Ujian</Label>
            <Select onValueChange={setSelectedScheduleId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih sesi munaqasyah" />
              </SelectTrigger>
              <SelectContent>
                {schedules?.data?.map((s: MunaqasyahSchedule) => (
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
                        <SelectItem key={s.requestId} value={s.requestId}>
                          {s.student.user.fullName} | {s.juz?.name ?? '-'} |{' '}
                          {s.stage
                            .replace('_', ' ')
                            .toLowerCase()
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Nilai</Label>
                <Input
                  type="number"
                  value={score ?? ''}
                  min={0}
                  max={100}
                  onChange={(e) => setScore(Number(e.target.value))}
                />
              </div>

              <div>
                <Label>Status & Grade</Label>
                <p className="text-muted-foreground">{getStatusLabel()}</p>
              </div>

              <div>
                <Label>Catatan</Label>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
              </div>

              <Button type="submit">Simpan</Button>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
