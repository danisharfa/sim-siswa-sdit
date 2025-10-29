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
import { toast } from 'sonner';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface TashihSchedule {
  id: string;
  date: string;
  sessionName: string;
  startTime: string;
  endTime: string;
}

interface StudentRequest {
  scheduleId: string;
  requestId: string;
  tashihType: 'ALQURAN' | 'WAFA';
  surah?: { name: string };
  juz?: { name: string };
  wafa?: { name: string };
  startPage?: number;
  endPage?: number;
  student: {
    nis: string;
    user: { fullName: string };
  };
  result?: {
    passed: boolean;
    notes?: string;
  } | null;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function TashihResultForm({ onSaved }: { onSaved: () => void }) {
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [passed, setPassed] = useState<boolean | null>(null);
  const [notes, setNotes] = useState('');

  const { data: schedules } = useSWR('/api/coordinator/tashih/schedule/available', fetcher);
  const { data: studentsResponse, mutate } = useSWR(
    selectedScheduleId ? `/api/coordinator/tashih/result/schedule/${selectedScheduleId}` : null,
    fetcher
  );

  const students: StudentRequest[] | undefined = studentsResponse?.data;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScheduleId || !selectedRequestId || passed === null) {
      toast.error('Harap lengkapi semua data');
      return;
    }

    const res = await fetch('/api/coordinator/tashih/result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scheduleId: selectedScheduleId,
        requestId: selectedRequestId,
        passed,
        notes,
      }),
    });

    const json = await res.json();
    if (json.success) {
      toast.success('Hasil tashih berhasil disimpan');
      setSelectedRequestId(null);
      setPassed(null);
      setNotes('');
      onSaved();
      mutate();
    } else {
      toast.error(json.message || 'Gagal menyimpan hasil tashih');
    }
  };

  useEffect(() => {
    setSelectedRequestId(null);
    setPassed(null);
    setNotes('');
  }, [selectedScheduleId]);

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Form Penilaian Tashih</h2>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="mb-2 block">Pilih Jadwal Tashih</Label>
            <Select onValueChange={setSelectedScheduleId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih sesi tashih" />
              </SelectTrigger>
              <SelectContent>
                {schedules?.data?.map((s: TashihSchedule) => (
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
                <Label className="mb-2 block">Pilih Siswa</Label>
                <Select onValueChange={setSelectedRequestId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih siswa" />
                  </SelectTrigger>
                  <SelectContent>
                    {students
                      .filter((s) => !s.result)
                      .map((s) => {
                        let materi = '-';
                        if (s.tashihType === 'ALQURAN') {
                          materi = `${s.surah?.name ?? '-'} (${s.juz?.name ?? '-'})`;
                        } else if (s.tashihType === 'WAFA') {
                          const hal =
                            s.startPage !== s.endPage ? `${s.startPage}–${s.endPage}` : s.startPage;
                          materi = `${s.wafa?.name ?? '-'} (Hal ${hal ?? '-'})`;
                        }

                        return (
                          <SelectItem key={s.requestId} value={s.requestId}>
                            {s.student.user.fullName} | {materi}
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block">Status Kelulusan</Label>
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
                <Label className="mb-2 block">Catatan</Label>
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
