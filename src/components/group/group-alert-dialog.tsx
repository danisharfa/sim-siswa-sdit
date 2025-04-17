'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface GroupAlertDialogProps {
  kelompok: { id: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function GroupAlertDialog({
  kelompok,
  open,
  onOpenChange,
  onConfirm,
}: GroupAlertDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/group/${kelompok.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Kelompok berhasil dihapus');
        onConfirm();
      } else {
        toast.error('Gagal menghapus kelompok');
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Terjadi kesalahan');
    }
    setLoading(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Kelompok?</AlertDialogTitle>
          <AlertDialogDescription>
            Aksi ini tidak bisa dibatalkan. Data kelompok akan hilang permanen.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={loading}>
            {loading ? 'Menghapus...' : 'Hapus'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
