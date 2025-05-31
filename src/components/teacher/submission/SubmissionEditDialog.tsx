'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { SubmissionType, SubmissionStatus, Adab } from '@prisma/client';
import { toast } from 'sonner';

interface Props {
  submission: {
    id: string;
    submissionType: SubmissionType;
    juz?: { id: number };
    surah?: { id: number };
    startVerse?: number;
    endVerse?: number;
    wafa?: { id: number };
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
  const [form, setForm] = useState({
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
                <Label>ID Juz</Label>
                <Input
                  type="number"
                  value={form.juzId ?? ''}
                  onChange={(e) => handleChange('juzId', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label>ID Surah</Label>
                <Input
                  type="number"
                  value={form.surahId ?? ''}
                  onChange={(e) => handleChange('surahId', parseInt(e.target.value))}
                />
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
                <Label>ID Wafa</Label>
                <Input
                  type="number"
                  value={form.wafaId ?? ''}
                  onChange={(e) => handleChange('wafaId', parseInt(e.target.value))}
                />
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
