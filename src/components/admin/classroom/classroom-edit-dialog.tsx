'use client';

import * as React from 'react';
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
  kelas: { id: string; namaKelas: string; tahunAjaran: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function ClassroomEditDialog({
  kelas,
  open,
  onOpenChange,
  onSave,
}: ClassroomEditDialogProps) {
  const [namaKelas, setNamaKelas] = React.useState(kelas.namaKelas);
  const [tahunAjaran, setTahunAjaran] = React.useState(kelas.tahunAjaran);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setNamaKelas(kelas.namaKelas);
    setTahunAjaran(kelas.tahunAjaran);
  }, [kelas]);

  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/classroom/${kelas.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ namaKelas, tahunAjaran }),
      });

      if (res.ok) {
        toast.success('Kelas berhasil diperbarui!');
        onSave();
        onOpenChange(false);
      } else {
        toast.error('Terjadi kesalahan saat menyimpan.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Terjadi kesalahan jaringan.');
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Kelas</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="namaKelas">Nama Kelas</Label>
            <Input
              id="namaKelas"
              value={namaKelas}
              onChange={(e) => setNamaKelas(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="tahunAjaran">Tahun Ajaran</Label>
            <Input
              id="tahunAjaran"
              value={tahunAjaran}
              onChange={(e) => setTahunAjaran(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
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
