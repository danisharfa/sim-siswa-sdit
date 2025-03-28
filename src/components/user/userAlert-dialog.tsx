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
import { useState } from 'react';

interface UserAlertDialogProps {
  userId: string;
  type: 'reset' | 'delete';
  open: boolean; // Tambahkan prop `open`
  onOpenChange: (isOpen: boolean) => void; // Tambahkan handler untuk kontrol state
  onConfirm: () => void;
}

export function UserAlertDialog({
  userId,
  type,
  open,
  onOpenChange,
  onConfirm,
}: UserAlertDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async () => {
    setLoading(true);
    setError(null);

    try {
      if (type === 'reset') {
        const res = await fetch(`/api/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resetPassword: true }),
        });

        if (!res.ok) throw new Error('Gagal mereset password');
      } else {
        const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });

        if (!res.ok) throw new Error('Gagal menghapus user');
      }

      onConfirm();
      onOpenChange(false); // Tutup dialog setelah sukses
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    }

    setLoading(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {type === 'reset' ? 'Reset Password' : 'Hapus User'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {type === 'reset'
              ? 'Apakah Anda yakin ingin mereset password user ini?'
              : 'Apakah Anda yakin ingin menghapus user ini? Tindakan ini tidak dapat dibatalkan.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p className="text-red-500">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>
            Batal
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleAction} disabled={loading}>
            {loading ? 'Loading...' : type === 'reset' ? 'Reset' : 'Hapus'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
