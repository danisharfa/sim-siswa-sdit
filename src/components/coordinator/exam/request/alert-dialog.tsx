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

interface ExamRequestAlertDialogProps {
  request: { id: string };
  type: 'accept' | 'reject';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function ExamRequestAlertDialog({
  request,
  type,
  open,
  onOpenChange,
  onSave,
}: ExamRequestAlertDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    setLoading(true);

    try {
      const res = await fetch(`/api/coordinator/exam/request/${request.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: type === 'accept' ? 'DITERIMA' : 'DITOLAK' }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Terjadi kesalahan saat memperbarui status');
      }

      toast.success(data.message);
      onSave();
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {type === 'accept' ? 'Terima Permintaan Ujian?' : 'Tolak Permintaan Ujian?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {type === 'accept'
              ? 'Permintaan ujian akan diterima dan dilanjutkan ke tahap penjadwalan.'
              : 'Permintaan ujian akan ditolak dan tidak dilanjutkan.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={handleAction} disabled={loading}>
            {loading ? 'Loading...' : type === 'accept' ? 'Terima' : 'Tolak'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
