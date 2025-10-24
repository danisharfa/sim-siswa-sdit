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

interface MunaqasyahScheduleAlertDialogProps {
  schedule: {
    id: string;
    sessionName: string;
    date: string;
    hasResults?: boolean;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function MunaqasyahScheduleAlertDialog({
  schedule,
  open,
  onOpenChange,
  onConfirm,
}: MunaqasyahScheduleAlertDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/coordinator/munaqasyah/schedule/${schedule.id}`, {
        method: 'DELETE',
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        toast.success('Jadwal munaqasyah berhasil dihapus');
        onConfirm();
      } else {
        const errorMsg = data?.message || 'Gagal menghapus jadwal munaqasyah';
        const devError = data?.error ? ` (${data.error})` : '';
        toast.error(`${errorMsg}${devError}`);
        console.error('Delete error:', data);
      }
    } catch (error) {
      console.error('Error deleting munaqasyah schedule:', error);
      toast.error('Terjadi kesalahan');
    }
    setLoading(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Jadwal Munaqasyah?</AlertDialogTitle>
          <AlertDialogDescription>
            Aksi ini tidak bisa dibatalkan. Jadwal <strong>{schedule.sessionName}</strong> pada
            tanggal <strong>{new Date(schedule.date).toLocaleDateString('id-ID')}</strong> akan
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
