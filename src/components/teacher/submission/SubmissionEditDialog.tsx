'use client';

import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Calendar01 } from '@/components/calendar/calendar-01';
import { SubmissionType, SubmissionStatus, Adab } from '@prisma/client';

interface Props {
  submission: {
    id: string;
    date: string;
    submissionType: SubmissionType;
    juz?: { id: number; name: string };
    surah?: { id: number; name: string };
    startVerse?: number;
    endVerse?: number;
    wafa?: { id: number; name: string };
    startPage?: number;
    endPage?: number;
    submissionStatus: SubmissionStatus;
    adab: Adab;
    note?: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function SubmissionEditDialog({ submission, open, onOpenChange, onSave }: Props) {
  const [loading, setLoading] = useState(false);
  const [juzList, setJuzList] = useState<{ id: number; name: string }[]>([]);
  const [surahList, setSurahList] = useState<{ id: number; name: string; verseCount: number }[]>(
    []
  );
  const [wafaList, setWafaList] = useState<{ id: number; name: string }[]>([]);
  const [form, setForm] = useState({
    date: submission.date,
    submissionType: submission.submissionType,
    juzId: submission.juz?.id ?? undefined,
    surahId: submission.surah?.id ?? undefined,
    startVerse: submission.startVerse ?? undefined,
    endVerse: submission.endVerse ?? undefined,
    wafaId: submission.wafa?.id ?? undefined,
    startPage: submission.startPage ?? undefined,
    endPage: submission.endPage ?? undefined,
    submissionStatus: submission.submissionStatus,
    adab: submission.adab,
    note: submission.note ?? '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [juzRes, surahRes, wafaRes] = await Promise.all([
          fetch('/api/juz'),
          fetch('/api/surah'),
          fetch('/api/wafa'),
        ]);

        const [juzData, surahData, wafaData] = await Promise.all([
          juzRes.json(),
          surahRes.json(),
          wafaRes.json(),
        ]);

        if (juzData.success) setJuzList(juzData.data);
        if (surahData.success) setSurahList(surahData.data);
        if (wafaData.success) setWafaList(wafaData.data);
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open]);

  // Reset form when submission changes
  useEffect(() => {
    setForm({
      date: submission.date,
      submissionType: submission.submissionType,
      juzId: submission.juz?.id ?? undefined,
      surahId: submission.surah?.id ?? undefined,
      startVerse: submission.startVerse ?? undefined,
      endVerse: submission.endVerse ?? undefined,
      wafaId: submission.wafa?.id ?? undefined,
      startPage: submission.startPage ?? undefined,
      endPage: submission.endPage ?? undefined,
      submissionStatus: submission.submissionStatus,
      adab: submission.adab,
      note: submission.note ?? '',
    });
  }, [submission]);

  type FormKey = keyof typeof form;
  const handleChange = (key: FormKey, value: string | number | undefined) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/submission/${submission.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (json.success) {
        toast.success('Setoran berhasil diperbarui');
        onSave();
        onOpenChange(false);
      } else {
        toast.error(json.message || 'Gagal memperbarui setoran');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan jaringan');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const isWafa = form.submissionType === 'TAHSIN_WAFA';
  const isQuran = form.submissionType === 'TAHFIDZ' || form.submissionType === 'TAHSIN_ALQURAN';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Setoran</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Calendar01
            value={new Date(form.date)}
            onChange={(date) => handleChange('date', date?.toISOString())}
            label="Tanggal"
            placeholder="Pilih tanggal"
          />

          <div>
            <Label>Jenis Setoran</Label>
            <Select
              value={form.submissionType}
              onValueChange={(val) => handleChange('submissionType', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(SubmissionType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replaceAll('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isQuran && (
            <>
              <div>
                <Label>Juz</Label>
                <Select
                  value={form.juzId?.toString() ?? ''}
                  onValueChange={(val) => handleChange('juzId', val ? parseInt(val) : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Juz" />
                  </SelectTrigger>
                  <SelectContent>
                    {juzList.map((juz) => (
                      <SelectItem key={juz.id} value={juz.id.toString()}>
                        {juz.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Surah</Label>
                <Select
                  value={form.surahId?.toString() ?? ''}
                  onValueChange={(val) => handleChange('surahId', val ? parseInt(val) : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Surah" />
                  </SelectTrigger>
                  <SelectContent>
                    {surahList.map((surah) => (
                      <SelectItem key={surah.id} value={surah.id.toString()}>
                        {surah.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Ayat Mulai</Label>
                  <Input
                    type="number"
                    value={form.startVerse ?? ''}
                    onChange={(e) => handleChange('startVerse', parseInt(e.target.value))}
                  />
                </div>
                <div className="flex-1">
                  <Label>Ayat Selesai</Label>
                  <Input
                    type="number"
                    value={form.endVerse ?? ''}
                    onChange={(e) => handleChange('endVerse', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </>
          )}

          {isWafa && (
            <>
              <div>
                <Label>Wafa</Label>
                <Select
                  value={form.wafaId?.toString() ?? ''}
                  onValueChange={(val) => handleChange('wafaId', val ? parseInt(val) : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Wafa" />
                  </SelectTrigger>
                  <SelectContent>
                    {wafaList.map((wafa) => (
                      <SelectItem key={wafa.id} value={wafa.id.toString()}>
                        {wafa.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Halaman Mulai</Label>
                  <Input
                    type="number"
                    value={form.startPage ?? ''}
                    onChange={(e) => handleChange('startPage', parseInt(e.target.value))}
                  />
                </div>
                <div className="flex-1">
                  <Label>Halaman Selesai</Label>
                  <Input
                    type="number"
                    value={form.endPage ?? ''}
                    onChange={(e) => handleChange('endPage', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <Label>Status</Label>
            <Select
              value={form.submissionStatus}
              onValueChange={(val) => handleChange('submissionStatus', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih status" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(SubmissionStatus).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replaceAll('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Adab</Label>
            <Select value={form.adab} onValueChange={(val) => handleChange('adab', val)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih adab" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(Adab).map((a) => (
                  <SelectItem key={a} value={a}>
                    {a.replaceAll('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Catatan</Label>
            <Textarea value={form.note} onChange={(e) => handleChange('note', e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Batal</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
