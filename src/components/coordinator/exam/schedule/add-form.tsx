'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';

interface ExamRequest {
  id: string;
  examType: 'SURAH' | 'JUZ';
  surah?: { id: number; name: string };
  juz?: { id: number; name: string };
  student: {
    nis: string;
    user: { fullName: string };
  };
  status: string; // Added the missing 'status' property
}

interface Props {
  onScheduleAdded: () => void;
}

export function AddScheduleForm({ onScheduleAdded }: Props) {
  const [date, setDate] = useState<Date | undefined>();
  const [sessionName, setSessionName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [requests, setRequests] = useState<ExamRequest[]>([]);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      const res = await fetch('/api/coordinator/exam/request');
      const json = await res.json();
      if (json.success) {
        setRequests(json.data.filter((r: ExamRequest) => r.status === 'DITERIMA'));
      } else {
        toast.error('Gagal memuat daftar permintaan ujian');
      }
    };
    fetchRequests();
  }, []);

  const toggleRequest = (id: string) => {
    setSelectedRequests((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !date ||
      !sessionName ||
      !startTime ||
      !endTime ||
      !location ||
      selectedRequests.length === 0
    ) {
      toast.error('Harap lengkapi semua data');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/coordinator/exam/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          sessionName,
          startTime,
          endTime,
          location,
          requestIds: selectedRequests,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success('Jadwal berhasil dibuat');
        setDate(undefined);
        setSessionName('');
        setStartTime('');
        setEndTime('');
        setLocation('');
        setSelectedRequests([]);
        onScheduleAdded();
      } else {
        toast.error(json.message || 'Gagal membuat jadwal');
      }
    } catch (error) {
      console.error(error);
      toast.error('Terjadi kesalahan saat mengirim data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Buat Jadwal Ujian</h2>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Tanggal Ujian</Label>
            <DatePicker value={date} onChange={setDate} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nama Sesi</Label>
              <Input
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="Sesi 1"
              />
            </div>
            <div>
              <Label>Jam Mulai</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <Label>Jam Selesai</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
            <div>
              <Label>Lokasi</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Contoh: Ruang 6A"
              />
            </div>
          </div>
          <div>
            <Label>Daftar Siswa & Info Ujian</Label>
            <div className="grid gap-2 max-h-[200px] overflow-auto border p-2 rounded-md">
              {requests.length === 0 ? (
                <p className="text-sm text-muted-foreground">Tidak ada permintaan DITERIMA.</p>
              ) : (
                requests.map((req) => (
                  <label key={req.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={selectedRequests.includes(req.id)}
                      onCheckedChange={() => toggleRequest(req.id)}
                    />
                    {req.student.user.fullName} ({req.student.nis}) -{' '}
                    {req.examType === 'SURAH'
                      ? `Surah: ${req.surah?.name}`
                      : `Juz: ${req.juz?.name}`}
                  </label>
                ))
              )}
            </div>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? 'Menyimpan...' : 'Buat Jadwal'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
