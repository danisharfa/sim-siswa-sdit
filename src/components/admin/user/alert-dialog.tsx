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

interface UserAlertDialogProps {
  user: { id: string };
  type: 'reset' | 'delete';
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: () => void;
}

export function UserAlertDialog({
  user,
  type,
  open,
  onOpenChange,
  onConfirm,
}: UserAlertDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleAction() {
    setLoading(true);

    try {
      const url = `/api/admin/user/${user.id}`;
      const options: RequestInit =
        type === 'reset'
          ? {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ resetPassword: true }),
            }
          : { method: 'DELETE' };

      const res = await fetch(url, options);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Terjadi kesalahan');
      }

      toast.success(
        data.message ||
          (type === 'reset' ? 'Password user berhasil direset!' : 'User berhasil dihapus!')
      );

      onConfirm();
      onOpenChange(false);
    } catch (error) {
      const message = getErrorMessage(error);
      console.error('Error:', message);
      toast.error(message || 'Terjadi kesalahan saat menghubungi server.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{type === 'reset' ? 'Reset Password' : 'Hapus User'}</AlertDialogTitle>
          <AlertDialogDescription>
            {type === 'reset'
              ? 'Apakah Anda yakin ingin mereset password user ini?'
              : 'Apakah Anda yakin ingin menghapus user ini? Tindakan ini tidak dapat dibatalkan.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={handleAction} disabled={loading}>
            {loading ? 'Loading...' : type === 'reset' ? 'Reset' : 'Hapus'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
