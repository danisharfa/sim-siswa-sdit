'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import useSWR from 'swr';
import { toast } from 'sonner';
import { HomeActivityType } from '@prisma/client';
import { HomeActivity } from '@/components/student/home-activity/HomeActivityTable';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Props {
  activity: HomeActivity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function HomeActivityEditDialog({ activity, open, onOpenChange, onSave }: Props) {
  const [loading, setLoading] = useState(false);

  const { data: juzList } = useSWR('/api/juz', fetcher);
  const { data: surahList } = useSWR('/api/surah', fetcher);

  const [activityType, setActivityType] = useState<HomeActivityType>(activity.activityType);
  const [juzName, setJuzName] = useState(activity.juz?.name || '');
  const [surahName, setSurahName] = useState(activity.surah?.name || '');
  const [startVerse, setStartVerse] = useState(activity.startVerse.toString());
  const [endVerse, setEndVerse] = useState(activity.endVerse.toString());
  const [note, setNote] = useState(activity.note || '');

  useEffect(() => {
    if (!open) return;
    setActivityType(activity.activityType);
    setJuzName(activity.juz?.name || '');
    setSurahName(activity.surah?.name || '');
    setStartVerse(activity.startVerse.toString());
    setEndVerse(activity.endVerse.toString());
    setNote(activity.note || '');
  }, [open, activity]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/student/home-activity/${activity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityType,
          juzName,
          surahName,
          startVerse: parseInt(startVerse),
          endVerse: parseInt(endVerse),
          note,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success('Aktivitas berhasil diperbarui');
        onSave();
        onOpenChange(false);
      } else {
        toast.error(json.message || 'Gagal memperbarui aktivitas');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan jaringan');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Aktivitas Rumah</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Jenis Aktivitas */}
          <div>
            <Label>Jenis Aktivitas</Label>
            <Select
              value={activityType}
              onValueChange={(val) => setActivityType(val as HomeActivityType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Aktivitas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MURAJAAH">Muraja&apos;ah</SelectItem>
                <SelectItem value="TILAWAH">Tilawah</SelectItem>
                <SelectItem value="TARJAMAH">Tarjamah</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Juz */}
          <div>
            <Label>Juz</Label>
            <Select value={juzName} onValueChange={setJuzName}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Juz" />
              </SelectTrigger>
              <SelectContent>
                {juzList?.data?.map((juz: { name: string }) => (
                  <SelectItem key={juz.name} value={juz.name}>
                    {juz.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Surah */}
          <div>
            <Label>Surah</Label>
            <Select value={surahName} onValueChange={setSurahName}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Surah" />
              </SelectTrigger>
              <SelectContent>
                {surahList?.data?.map((surah: { name: string }) => (
                  <SelectItem key={surah.name} value={surah.name}>
                    {surah.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ayat */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Ayat Mulai</Label>
              <Input
                type="number"
                value={startVerse}
                onChange={(e) => setStartVerse(e.target.value)}
                placeholder="Contoh: 1"
              />
            </div>
            <div className="flex-1">
              <Label>Ayat Selesai</Label>
              <Input
                type="number"
                value={endVerse}
                onChange={(e) => setEndVerse(e.target.value)}
                placeholder="Contoh: 7"
              />
            </div>
          </div>

          {/* Catatan */}
          <div>
            <Label>Catatan</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Catatan tambahan (opsional)"
            />
          </div>

          {/* Tombol */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
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
