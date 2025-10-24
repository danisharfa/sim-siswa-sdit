'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar01 } from '@/components/layout/calendar/calendar-01';
import { toast } from 'sonner';

interface TashihScheduleEditDialogProps {
  schedule: {
    id: string;
    date: string;
    sessionName: string;
    startTime: string;
    endTime: string;
    location: string;
    hasResults?: boolean;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function TashihScheduleEditDialog({
  schedule,
  open,
  onOpenChange,
  onSave,
}: TashihScheduleEditDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [formData, setFormData] = useState({
    sessionName: '',
    startTime: '',
    endTime: '',
    location: '',
  });
  const [loading, setLoading] = useState(false);

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
    }
  }, [schedule]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
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
      };

      const res = await fetch(`/api/coordinator/tashih/schedule/${schedule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        toast.error(data?.message || 'Gagal mengedit jadwal tashih');
        return;
      }

      toast.success(data.message || 'Jadwal tashih berhasil diedit');
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Jadwal Tashih</DialogTitle>
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
