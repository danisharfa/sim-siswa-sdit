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
import { toast } from 'sonner';

interface ClassroomEditDialogProps {
  classroom: { id: string; name: string; academicYear: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function ClassroomEditDialog({
  classroom,
  open,
  onOpenChange,
  onSave,
}: ClassroomEditDialogProps) {
  const [name, setName] = useState(classroom.name);
  const [academicYear, setAcademicYear] = useState(classroom.academicYear);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(classroom.name);
    setAcademicYear(classroom.academicYear);
  }, [classroom]);

  async function handleSave() {
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/classroom/${classroom.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, academicYear }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        toast.error(data?.message || 'Gagal mengedit kelas');
        return;
      }

      toast.success(data.message || 'Kelas berhasil diedit');
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Kelas</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nama Kelas</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="academicYear">Tahun Ajaran</Label>
            <Input
              id="academicYear"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
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
