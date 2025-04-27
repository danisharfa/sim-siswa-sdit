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

interface GroupEditDialogProps {
  kelompok: { id: string; namaKelompok: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function GroupEditDialog({
  kelompok,
  open,
  onOpenChange,
  onSave,
}: GroupEditDialogProps) {
  const [namaKelompok, setNamaKelompok] = React.useState(kelompok.namaKelompok);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setNamaKelompok(kelompok.namaKelompok);
  }, [kelompok]);

  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/group/${kelompok.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ namaKelompok }),
      });

      if (res.ok) {
        toast.success('Nama kelompok berhasil diperbarui!');
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
          <DialogTitle>Edit Kelompok</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="namaKelompok">Nama Kelompok</Label>
            <Input
              id="namaKelompok"
              value={namaKelompok}
              onChange={(e) => setNamaKelompok(e.target.value)}
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
