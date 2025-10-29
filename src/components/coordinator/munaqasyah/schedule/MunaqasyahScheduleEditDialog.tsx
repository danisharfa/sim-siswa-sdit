'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar01 } from '@/components/layout/calendar/calendar-01';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import useSWR from 'swr';
import { MunaqasyahBatch, MunaqasyahStage } from '@prisma/client';

interface Examiner {
  id: string;
  name: string;
  role: string;
}

interface MunaqasyahScheduleEditDialogProps {
  schedule: {
    id: string;
    date: string;
    sessionName: string;
    startTime: string;
    endTime: string;
    location: string;
    examiner?: { userId?: string; user?: { fullName: string } };
    hasResults?: boolean;
    scheduleRequests: {
      request: {
        id: string;
        batch: MunaqasyahBatch;
        stage: MunaqasyahStage;
        student: {
          nis: string;
          user: { fullName: string };
        };
        teacher: { user: { fullName: string } };
        group: {
          name: string;
          classroom: {
            name: string;
            academicYear: string;
            semester: string;
          };
        };
        juz: { name: string };
      };
    }[];
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function MunaqasyahScheduleEditDialog({
  schedule,
  open,
  onOpenChange,
  onSave,
}: MunaqasyahScheduleEditDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [formData, setFormData] = useState({
    sessionName: '',
    startTime: '',
    endTime: '',
    location: '',
  });
  const [examinerId, setExaminerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [studentsToRemove, setStudentsToRemove] = useState<string[]>([]);

  // Fetch examiners data
  const { data: examinersData } = useSWR<{ success: boolean; data: Examiner[] }>(
    '/api/coordinator/munaqasyah/schedule/examiner',
    (url: string) => fetch(url).then((res) => res.json())
  );

  const examiners = examinersData?.data || [];

  // Label mappings
  const batchLabels: Record<MunaqasyahBatch, string> = {
    [MunaqasyahBatch.TAHAP_1]: 'Tahap 1',
    [MunaqasyahBatch.TAHAP_2]: 'Tahap 2',
    [MunaqasyahBatch.TAHAP_3]: 'Tahap 3',
    [MunaqasyahBatch.TAHAP_4]: 'Tahap 4',
  };

  const stageLabels: Record<MunaqasyahStage, string> = {
    [MunaqasyahStage.TASMI]: 'Tasmi',
    [MunaqasyahStage.MUNAQASYAH]: 'Munaqasyah',
  };

  useEffect(() => {
    if (schedule) {
      const date = new Date(schedule.date);
      setSelectedDate(date);
      setFormData({
        sessionName: schedule.sessionName,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        location: schedule.location,
      });
      // Initialize examiner selection
      setExaminerId(schedule.examiner?.userId || 'coordinator');
      setStudentsToRemove([]);
    }
  }, [schedule]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRemoveStudent = (requestId: string) => {
    setStudentsToRemove((prev) => [...prev, requestId]);
  };

  const handleUndoRemove = (requestId: string) => {
    setStudentsToRemove((prev) => prev.filter((id) => id !== requestId));
  };

  async function handleSave() {
    if (!selectedDate) {
      toast.error('Harap pilih tanggal');
      return;
    }

    setLoading(true);

    try {
      const requestData = {
        ...formData,
        date: selectedDate.toISOString(),
        examinerId: examinerId === 'coordinator' ? null : examinerId,
        studentsToRemove,
      };

      const res = await fetch(`/api/coordinator/munaqasyah/schedule/${schedule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        toast.error(data?.message || 'Gagal mengedit jadwal munaqasyah');
        return;
      }

      toast.success(data.message || 'Jadwal munaqasyah berhasil diedit');
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error('Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Jadwal Munaqasyah</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Calendar01
            value={selectedDate}
            onChange={setSelectedDate}
            label="Tanggal"
            placeholder="Pilih tanggal jadwal"
          />
          <div>
            <Label htmlFor="sessionName">Nama Sesi</Label>
            <Input
              id="sessionName"
              value={formData.sessionName}
              onChange={(e) => handleInputChange('sessionName', e.target.value)}
              placeholder="Contoh: Sesi 1, Sesi Pagi, dll."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Waktu Mulai</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => handleInputChange('startTime', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endTime">Waktu Selesai</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => handleInputChange('endTime', e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="location">Lokasi</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Contoh: Aula, Kelas 6A, dll."
            />
          </div>
          <div>
            <Label htmlFor="examiner">Penguji</Label>
            <Select value={examinerId} onValueChange={setExaminerId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Penguji" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="coordinator">Koordinator Al-Qur&apos;an</SelectItem>
                {examiners.map((examiner) => (
                  <SelectItem key={examiner.id} value={examiner.id}>
                    {examiner.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Daftar Siswa yang Terdaftar */}
          <div className="space-y-2">
            <Label>Siswa yang Terdaftar ({schedule.scheduleRequests.length})</Label>
            <div className="border rounded-md p-3 space-y-2 max-h-[300px] overflow-y-auto">
              {schedule.scheduleRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Tidak ada siswa terdaftar
                </p>
              ) : (
                schedule.scheduleRequests.map((s) => {
                  const isMarkedForRemoval = studentsToRemove.includes(s.request.id);
                  const req = s.request;

                  return (
                    <div
                      key={req.id}
                      className={`flex items-start justify-between gap-3 p-3 rounded-md border transition-all ${
                        isMarkedForRemoval
                          ? 'bg-destructive/10 border-destructive/50 opacity-60'
                          : 'bg-muted/50'
                      }`}
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="font-medium">
                            {req.student.user.fullName}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            NIS: {req.student.nis}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <div>
                            Kelompok: {req.group.name} - {req.group.classroom.name}
                          </div>
                          <div>Guru: {req.teacher.user.fullName}</div>
                          <div className="flex items-center gap-2 flex-wrap mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {batchLabels[req.batch]}
                            </Badge>
                            <Badge variant="default" className="text-xs">
                              {stageLabels[req.stage]}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {req.juz.name}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {isMarkedForRemoval ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleUndoRemove(req.id)}
                            className="text-xs"
                          >
                            Batal
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveStudent(req.id)}
                            className="text-xs"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Keluarkan
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {studentsToRemove.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {studentsToRemove.length} siswa akan dikeluarkan dari jadwal ini dan dapat
                di-reschedule ulang.
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
