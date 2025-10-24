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

interface MunaqasyahResultAlertDialogProps {
  result: {
    id: string;
    student: {
      nis: string;
      user: { fullName: string };
    };
    schedule: {
      date: string;
      sessionName: string;
    };
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function MunaqasyahResultAlertDialog({
  result,
  open,
  onOpenChange,
  onConfirm,
}: MunaqasyahResultAlertDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/coordinator/munaqasyah/result/${result.id}`, {
        method: 'DELETE',
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        toast.success('Hasil munaqasyah berhasil dihapus');
        onConfirm();
      } else {
        const errorMsg = data?.message || 'Gagal menghapus hasil munaqasyah';
        const devError = data?.error ? ` (${data.error})` : '';
        toast.error(`${errorMsg}${devError}`);
        console.error('Delete error:', data);
      }
    } catch (error) {
      console.error('Error deleting munaqasyah result:', error);
      toast.error('Terjadi kesalahan');
    }
    setLoading(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Hasil Munaqasyah?</AlertDialogTitle>
          <AlertDialogDescription>
            Aksi ini tidak bisa dibatalkan. Hasil munaqasyah siswa{' '}
            <strong>{result.student.user.fullName}</strong> pada jadwal{' '}
            <strong>{result.schedule.sessionName}</strong> tanggal{' '}
            <strong>{new Date(result.schedule.date).toLocaleDateString('id-ID')}</strong> akan
            hilang permanen.
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
