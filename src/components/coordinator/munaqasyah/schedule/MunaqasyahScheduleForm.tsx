'use client';

import { useEffect, useState } from 'react';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Calendar01 } from '@/components/layout/calendar/calendar-01';
import { MunaqasyahRequestStatus, Role } from '@prisma/client';

interface Examiner {
  id: string;
  name: string;
  role: Role;
}

interface MunaqasyahRequest {
  id: string;
  status: MunaqasyahRequestStatus;
  student: {
    nis: string;
    user: { fullName: string };
  };
  teacher: { user: { fullName: string } };
  group: {
    id: string;
    name: string;
    classroom: {
      name: string;
      academicYear: string;
      semester: string;
    };
  };
  juz: { name: string };
  scheduleRequests: { id: string }[];
}

interface Props {
  onScheduleAdded: () => void;
}

export function MunaqasyahScheduleForm({ onScheduleAdded }: Props) {
  const [date, setDate] = useState<Date>();
  const [sessionName, setSessionName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [examinerId, setExaminerId] = useState('');

  const [requests, setRequests] = useState<MunaqasyahRequest[]>([]);
  const [examiners, setExaminers] = useState<Examiner[]>([]);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
    fetchTeachers();
  }, []);

  async function fetchRequests() {
    const res = await fetch('/api/coordinator/munaqasyah/request');
    const json = await res.json();
    if (json.success) {
      const filtered = json.data.filter(
        (r: MunaqasyahRequest) =>
          r.status === MunaqasyahRequestStatus.DITERIMA && r.scheduleRequests?.length === 0
      );
      setRequests(filtered);
    } else {
      toast.error('Gagal memuat daftar permintaan munaqasyah');
    }
  }

  async function fetchTeachers() {
    const res = await fetch('/api/coordinator/munaqasyah/schedule/examiner');
    const json = await res.json();
    if (json.success) setExaminers(json.data);
    else toast.error('Gagal memuat daftar penguji');
  }

  const toggleRequest = (id: string) => {
    setSelectedRequests((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRequests.length) {
      toast.error('Pilih minimal satu siswa');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/coordinator/munaqasyah/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          sessionName,
          startTime,
          endTime,
          location,
          examinerId: examinerId === 'none' ? null : examinerId,
          requestIds: selectedRequests,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(json.message || 'Berhasil menyimpan jadwal munaqasyah');
        setDate(new Date());
        setSessionName('');
        setStartTime('');
        setEndTime('');
        setLocation('');
        setExaminerId('');
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
        <h2 className="text-xl font-semibold">Buat Jadwal Munaqasyah</h2>
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
              <Label className="mb-2 block">Waktu Mulai</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <Label className="mb-2 block">Waktu Selesai</Label>
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
            <div>
              <Label className="mb-2 block">Penguji</Label>
              <Select value={examinerId} onValueChange={setExaminerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Penguji" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Koordinator Al-Qur&apos;an</SelectItem>
                  {examiners.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Daftar Permintaan Munaqasyah</Label>
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
                        {req.juz?.name ? req.juz.name : 'Materi tidak tersedia'}
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
