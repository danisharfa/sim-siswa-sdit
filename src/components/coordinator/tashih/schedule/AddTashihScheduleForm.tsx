'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar01 } from '@/components/layout/calendar/calendar-01';

interface TashihRequest {
  id: string;
  notes?: string;
  status: 'MENUNGGU' | 'DITERIMA' | 'DITOLAK' | 'SELESAI';
  student: {
    nis: string;
    user: { fullName: string };
  };
  teacher: {
    user: { fullName: string };
  };
  tashihType?: 'ALQURAN' | 'WAFA';
  surah?: { name: string };
  juz?: { name: string };
  wafa?: { name: string };
  startPage?: number;
  endPage?: number;
  schedules: [];
}

interface Props {
  onScheduleAdded: () => void;
}

export function AddTashihScheduleForm({ onScheduleAdded }: Props) {
  const [date, setDate] = useState<Date>();
  const [sessionName, setSessionName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [requests, setRequests] = useState<TashihRequest[]>([]);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    const res = await fetch('/api/coordinator/tashih/request');
    const json = await res.json();
    if (json.success) {
      const filtered = json.data.filter(
        (r: TashihRequest) =>
          r.status === 'DITERIMA' && Array.isArray(r.schedules) && r.schedules.length === 0
      );
      setRequests(filtered);
    } else {
      toast.error('Gagal memuat daftar permintaan tashih');
    }
  }

  const toggleRequest = (id: string) => {
    setSelectedRequests((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      const res = await fetch('/api/coordinator/tashih/schedule', {
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
        toast.success(json.message || 'Berhasil menyimpan jadwal tashih');
        setDate(new Date());
        setSessionName('');
        setStartTime('');
        setEndTime('');
        setLocation('');
        setSelectedRequests([]);
        onScheduleAdded();
        fetchRequests();
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
        <h2 className="text-xl font-semibold">Buat Jadwal Tashih</h2>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Calendar01 value={date} onChange={setDate} label="Tanggal Setoran" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">Nama Sesi</Label>
              <Input
                value={sessionName}
                placeholder="Sesi 1"
                onChange={(e) => setSessionName(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-2 block">Jam Mulai</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <Label className="mb-2 block">Jam Selesai</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
            <div>
              <Label className="mb-2 block">Lokasi</Label>
              <Input
                value={location}
                placeholder="Ruang Guru"
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Daftar Permintaan Tashih</Label>
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
                    <div>
                      <div className="font-medium">
                        {req.student.user.fullName} ({req.student.nis})
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {req.tashihType === 'ALQURAN'
                          ? `${req.surah?.name ?? '-'} (${req.juz?.name ?? '-'})`
                          : `${req.wafa?.name ?? '-'} (Hal ${req.startPage ?? '-'}${
                              req.startPage !== req.endPage ? `–${req.endPage}` : ''
                            })`}
                      </div>
                    </div>
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
