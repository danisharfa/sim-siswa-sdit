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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface TashihResultEditDialogProps {
  result: {
    id: string;
    passed: boolean;
    notes?: string;
    tashihRequest: {
      student: {
        user: { fullName: string };
      };
    };
    tashihSchedule: {
      date: string;
      sessionName: string;
    };
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function TashihResultEditDialog({
  result,
  open,
  onOpenChange,
  onSave,
}: TashihResultEditDialogProps) {
  const [formData, setFormData] = useState({
    passed: false,
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (result) {
      setFormData({
        passed: result.passed,
        notes: result.notes || '',
      });
    }
  }, [result]);

  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      passed: value === 'true',
    }));
  };

  const handleNotesChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      notes: value,
    }));
  };

  async function handleSave() {
    setLoading(true);

    try {
      const res = await fetch(`/api/coordinator/tashih/result/${result.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        toast.error(data?.message || 'Gagal mengedit hasil tashih');
        return;
      }

      toast.success(data.message || 'Hasil tashih berhasil diedit');
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
          <DialogTitle>Edit Hasil Tashih</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Info Siswa */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">
              Siswa: {result.tashihRequest.student.user.fullName}
            </p>
            <p className="text-xs text-muted-foreground">
              {result.tashihSchedule.sessionName} -{' '}
              {new Date(result.tashihSchedule.date).toLocaleDateString('id-ID')}
            </p>
          </div>

          {/* Status Kelulusan */}
          <div>
            <Label htmlFor="status">Status Kelulusan</Label>
            <Select value={formData.passed.toString()} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih status kelulusan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Lulus</SelectItem>
                <SelectItem value="false">Tidak Lulus</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Catatan */}
          <div>
            <Label htmlFor="notes">Catatan (Opsional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Tambahkan catatan hasil tashih..."
              rows={4}
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
