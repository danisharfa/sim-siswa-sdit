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
import { getErrorMessage } from '@/lib/utils';

interface HomeActivityAlertDialogProps {
  activity: { id: string };
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: () => void;
}

export function HomeActivityAlertDialog({
  activity,
  open,
  onOpenChange,
  onConfirm,
}: HomeActivityAlertDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/student/home-activity/${activity.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Aktivitas berhasil dihapus');
        onConfirm();
        onOpenChange(false);
      } else {
        toast.error(json.message || 'Gagal menghapus aktivitas');
      }
    } catch (error) {
      console.error(error);
      const message = getErrorMessage?.(error) || 'Terjadi kesalahan saat menghapus aktivitas';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Aktivitas Rumah</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus aktivitas ini? Tindakan ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={loading}>
            {loading ? 'Menghapus...' : 'Hapus'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
