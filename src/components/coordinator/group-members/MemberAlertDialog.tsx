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

interface MemberAlertDialogProps {
  member: { nis: string };
  groupId: string;
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: () => void;
}

export function MemberAlertDialog({
  member,
  groupId,
  open,
  onOpenChange,
  onConfirm,
}: MemberAlertDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleAction() {
    setLoading(true);

    try {
      const res = await fetch(`/api/coordinator/group/${groupId}/member`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nis: member.nis }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Terjadi kesalahan saat menghapus siswa.');
      }

      toast.success('Siswa berhasil dihapus dari kelompok');
      onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      const message = getErrorMessage(error);
      toast.error(message || 'Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Siswa Kelompok</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus siswa ini dari kelompok? Tindakan ini tidak dapat
            dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading} onClick={() => onOpenChange(false)}>
            Batal
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleAction} disabled={loading}>
            {loading ? 'Menghapus...' : 'Hapus'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
