'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
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
import { toast } from 'sonner';
import { type DateRange } from 'react-day-picker';
import { Calendar23 } from '@/components/calendar/calendar-23';
import { SubmissionType } from '@prisma/client';

interface SurahJuz {
  id: number;
  juzId: number;
  startVerse: number;
  endVerse: number;
  surah: {
    id: number;
    name: string;
    verseCount: number;
  };
  juz: {
    id: number;
    name: string;
  };
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
    startDate: Date;
    endDate: Date;
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

  const [juzList, setJuzList] = useState<{ id: number; name: string }[]>([]);
  const [surahJuzList, setSurahJuzList] = useState<SurahJuz[]>([]);
  const [wafaList, setWafaList] = useState<Wafa[]>([]);

  const [startJuzId, setStartJuzId] = useState('');
  const [endJuzId, setEndJuzId] = useState('');
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
      const [juzRes, surahJuzRes, wafaRes] = await Promise.all([
        fetch('/api/juz'),
        fetch('/api/surahJuz'),
        fetch('/api/wafa'),
      ]);
      const [juzData, surahJuzData, wafaData] = await Promise.all([
        juzRes.json(),
        surahJuzRes.json(),
        wafaRes.json(),
      ]);

      if (juzData.success) setJuzList(juzData.data);
      if (surahJuzData.success) setSurahJuzList(surahJuzData.data);
      if (wafaData.success) setWafaList(wafaData.data);
    };
    fetchData();
  }, []);

  // Filter surah berdasarkan juz
  const filteredSurahStart = surahJuzList
    .filter((s) => s.juzId.toString() === startJuzId)
    .sort((a, b) => a.surah.id - b.surah.id);

  const filteredSurahEnd = surahJuzList
    .filter((s) => s.juzId.toString() === endJuzId)
    .sort((a, b) => a.surah.id - b.surah.id);

  // Set initial juz values based on existing surah
  useEffect(() => {
    if (surahJuzList.length > 0 && target.surahStartId && !startJuzId) {
      const startSurahJuz = surahJuzList.find((s) => s.surah.id === target.surahStartId);
      if (startSurahJuz) {
        setStartJuzId(startSurahJuz.juzId.toString());
      }
    }
    if (surahJuzList.length > 0 && target.surahEndId && !endJuzId) {
      const endSurahJuz = surahJuzList.find((s) => s.surah.id === target.surahEndId);
      if (endSurahJuz) {
        setEndJuzId(endSurahJuz.juzId.toString());
      }
    }
  }, [surahJuzList, target.surahStartId, target.surahEndId, startJuzId, endJuzId]);

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
      surahStartId: type !== SubmissionType.TAHSIN_WAFA ? parseInt(surahStartId) || null : null,
      surahEndId: type !== SubmissionType.TAHSIN_WAFA ? parseInt(surahEndId) || null : null,
      startAyat: type !== SubmissionType.TAHSIN_WAFA ? parseInt(startAyat) || null : null,
      endAyat: type !== SubmissionType.TAHSIN_WAFA ? parseInt(endAyat) || null : null,
      wafaId: type === SubmissionType.TAHSIN_WAFA ? parseInt(wafaId) || null : null,
      startPage: type === SubmissionType.TAHSIN_WAFA ? parseInt(startPage) || null : null,
      endPage: type === SubmissionType.TAHSIN_WAFA ? parseInt(endPage) || null : null,
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Target Setoran</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Calendar23
            value={dateRange}
            onChange={(range) => {
              if (range) {
                setDateRange(range);
              }
            }}
          />

          <div>
            <Label className="mb-2 block">Jenis Setoran</Label>
            <Select value={type} onValueChange={(v) => setType(v as SubmissionType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SubmissionType.TAHFIDZ}>Tahfidz</SelectItem>
                <SelectItem value={SubmissionType.TAHSIN_WAFA}>Tahsin (Wafa)</SelectItem>
                <SelectItem value={SubmissionType.TAHSIN_ALQURAN}>Tahsin (Al-Quran)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bagian Juz dan Surah untuk TAHFIDZ dan TAHSIN_ALQURAN */}
          {(type === SubmissionType.TAHFIDZ || type === SubmissionType.TAHSIN_ALQURAN) && (
            <div className="flex flex-col space-y-4">
              {/* Juz Awal dan Juz Akhir */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 min-w-0">
                  <Label className="mb-2 block">Juz Awal</Label>
                  <Select value={startJuzId} onValueChange={setStartJuzId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Juz Awal" />
                    </SelectTrigger>
                    <SelectContent>
                      {juzList.map((j) => (
                        <SelectItem key={j.id} value={j.id.toString()}>
                          {j.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-0">
                  <Label className="mb-2 block">Juz Akhir</Label>
                  <Select value={endJuzId} onValueChange={setEndJuzId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Juz Akhir" />
                    </SelectTrigger>
                    <SelectContent>
                      {juzList.map((j) => (
                        <SelectItem key={j.id} value={j.id.toString()}>
                          {j.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Surah Awal dan Surah Akhir */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 min-w-0">
                  <Label className="mb-2 block">Surah Awal</Label>
                  <Select value={surahStartId} onValueChange={setSurahStartId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Surah Awal" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSurahStart.map((s) => (
                        <SelectItem key={s.surah.id} value={s.surah.id.toString()}>
                          {s.surah.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-0">
                  <Label className="mb-2 block">Surah Akhir</Label>
                  <Select value={surahEndId} onValueChange={setSurahEndId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Surah Akhir" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSurahEnd.map((s) => (
                        <SelectItem key={s.surah.id} value={s.surah.id.toString()}>
                          {s.surah.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Ayat Awal dan Ayat Akhir */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 min-w-0">
                  <Label className="mb-2 block">Ayat Awal</Label>
                  <Input
                    type="number"
                    value={startAyat}
                    onChange={(e) => setStartAyat(e.target.value)}
                    placeholder="1"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <Label className="mb-2 block">Ayat Akhir</Label>
                  <Input
                    type="number"
                    value={endAyat}
                    onChange={(e) => setEndAyat(e.target.value)}
                    placeholder="1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Bagian Wafa untuk TAHSIN_WAFA */}
          {type === SubmissionType.TAHSIN_WAFA && (
            <div className="flex flex-col space-y-4">
              <div className="flex-1 min-w-0">
                <Label className="mb-2 block">Materi Wafa</Label>
                <Select value={wafaId} onValueChange={setWafaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Wafa" />
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
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 min-w-0">
                  <Label className="mb-2 block">Halaman Awal</Label>
                  <Input
                    type="number"
                    value={startPage}
                    onChange={(e) => setStartPage(e.target.value)}
                    placeholder="1"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <Label className="mb-2 block">Halaman Akhir</Label>
                  <Input
                    type="number"
                    value={endPage}
                    onChange={(e) => setEndPage(e.target.value)}
                    placeholder="1"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <Label className="mb-2 block">Deskripsi</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

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