'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DateRange } from 'react-day-picker';
import { DatePickerWithRange } from '@/components/ui/date-picker-range';
import { SubmissionType } from '@prisma/client';
import { toast } from 'sonner';

interface Surah {
  id: number;
  name: string;
  verseCount: number;
}

interface Wafa {
  id: number;
  name: string;
}

interface TargetEditDialogProps {
  target: {
    id: string;
    studentId: string;
    type: SubmissionType;
    description: string;
    startDate: string;
    endDate: string;
    surahStartId?: number;
    surahEndId?: number;
    startAyat?: number;
    endAyat?: number;
    wafaId?: number;
    startPage?: number;
    endPage?: number;
  };
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: () => void;
}

export function TargetEditDialog({ target, open, onOpenChange, onSave }: TargetEditDialogProps) {
  const [type, setType] = useState<SubmissionType>(target.type);
  const [description, setDescription] = useState(target.description);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(target.startDate),
    to: new Date(target.endDate),
  });

  const [surahList, setSurahList] = useState<Surah[]>([]);
  const [wafaList, setWafaList] = useState<Wafa[]>([]);

  const [surahStartId, setSurahStartId] = useState(target.surahStartId?.toString() || '');
  const [surahEndId, setSurahEndId] = useState(target.surahEndId?.toString() || '');
  const [startAyat, setStartAyat] = useState(target.startAyat?.toString() || '');
  const [endAyat, setEndAyat] = useState(target.endAyat?.toString() || '');
  const [wafaId, setWafaId] = useState(target.wafaId?.toString() || '');
  const [startPage, setStartPage] = useState(target.startPage?.toString() || '');
  const [endPage, setEndPage] = useState(target.endPage?.toString() || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [surahRes, wafaRes] = await Promise.all([fetch('/api/surah'), fetch('/api/wafa')]);
      const [surahData, wafaData] = await Promise.all([surahRes.json(), wafaRes.json()]);

      if (surahData.success) setSurahList(surahData.data);
      if (wafaData.success) setWafaList(wafaData.data);
    };
    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast.error('Tanggal belum lengkap');
      return;
    }

    const payload = {
      studentId: target.studentId,
      type,
      description,
      startDate: dateRange.from,
      endDate: dateRange.to,
      surahStartId: type === 'TAHFIDZ' ? parseInt(surahStartId) || null : null,
      surahEndId: type === 'TAHFIDZ' ? parseInt(surahEndId) || null : null,
      startAyat: type === 'TAHFIDZ' ? parseInt(startAyat) || null : null,
      endAyat: type === 'TAHFIDZ' ? parseInt(endAyat) || null : null,
      wafaId: type === 'TAHSIN_WAFA' ? parseInt(wafaId) || null : null,
      startPage: type === 'TAHSIN_WAFA' ? parseInt(startPage) || null : null,
      endPage: type === 'TAHSIN_WAFA' ? parseInt(endPage) || null : null,
    };

    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/weekly-target/${target.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        toast.success('Target berhasil diperbarui');
        onSave();
        onOpenChange(false);
      } else {
        toast.error(json.message || 'Gagal memperbarui target');
      }
    } catch (error) {
      console.error(error);
      toast.error('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Target Setoran</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Label>Rentang Tanggal</Label>
          <DatePickerWithRange value={dateRange} onChange={setDateRange} />

          <Label>Jenis Setoran</Label>
          <Select value={type} onValueChange={(v) => setType(v as SubmissionType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TAHFIDZ">Tahfidz</SelectItem>
              <SelectItem value="TAHSIN_WAFA">Tahsin (Wafa)</SelectItem>
            </SelectContent>
          </Select>

          {type === 'TAHFIDZ' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Surah Awal</Label>
                <Select value={surahStartId} onValueChange={setSurahStartId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {surahList.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Surah Akhir</Label>
                <Select value={surahEndId} onValueChange={setSurahEndId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {surahList.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                placeholder="Ayat Awal"
                value={startAyat}
                onChange={(e) => setStartAyat(e.target.value)}
              />
              <Input
                placeholder="Ayat Akhir"
                value={endAyat}
                onChange={(e) => setEndAyat(e.target.value)}
              />
            </div>
          )}

          {type === 'TAHSIN_WAFA' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Materi Wafa</Label>
                <Select value={wafaId} onValueChange={setWafaId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {wafaList.map((w) => (
                      <SelectItem key={w.id} value={w.id.toString()}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                placeholder="Halaman Awal"
                value={startPage}
                onChange={(e) => setStartPage(e.target.value)}
              />
              <Input
                placeholder="Halaman Akhir"
                value={endPage}
                onChange={(e) => setEndPage(e.target.value)}
              />
            </div>
          )}

          <Label>Deskripsi</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
