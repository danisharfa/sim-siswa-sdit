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
import { MunaqosyahRequestStatus } from '@prisma/client';

interface RequestStatusAlertDialogProps {
  request: { id: string };
  type: 'accept' | 'reject';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function RequestStatusAlertDialog({
  request,
  type,
  open,
  onOpenChange,
  onSave,
}: RequestStatusAlertDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    setLoading(true);

    try {
      const res = await fetch(`/api/coordinator/munaqasyah/request/${request.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status:
            type === 'accept' ? MunaqosyahRequestStatus.DITERIMA : MunaqosyahRequestStatus.DITOLAK,
        }),
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
            {type === 'accept' ? 'Terima Permintaan Munaqasyah?' : 'Tolak Permintaan Munaqasyah?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {type === 'accept'
              ? 'Permintaan munaqasyah akan diterima dan dilanjutkan ke tahap penjadwalan.'
              : 'Permintaan munaqasyah akan ditolak dan tidak dilanjutkan.'}
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
