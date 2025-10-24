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

interface TashihResultAlertDialogProps {
  result: {
    id: string;
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
  onConfirm: () => void;
}

export function TashihResultAlertDialog({
  result,
  open,
  onOpenChange,
  onConfirm,
}: TashihResultAlertDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/coordinator/tashih/result/${result.id}`, {
        method: 'DELETE',
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        toast.success('Hasil tashih berhasil dihapus');
        onConfirm();
      } else {
        const errorMsg = data?.message || 'Gagal menghapus hasil tashih';
        const devError = data?.error ? ` (${data.error})` : '';
        toast.error(`${errorMsg}${devError}`);
        console.error('Delete error:', data);
      }
    } catch (error) {
      console.error('Error deleting tashih result:', error);
      toast.error('Terjadi kesalahan');
    }
    setLoading(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Hasil Tashih?</AlertDialogTitle>
          <AlertDialogDescription>
            Aksi ini tidak bisa dibatalkan. Hasil tashih siswa{' '}
            <strong>{result.tashihRequest.student.user.fullName}</strong> pada jadwal{' '}
            <strong>{result.tashihSchedule.sessionName}</strong> tanggal{' '}
            <strong>{new Date(result.tashihSchedule.date).toLocaleDateString('id-ID')}</strong> akan
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
