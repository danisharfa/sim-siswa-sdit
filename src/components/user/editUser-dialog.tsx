'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EditUserDialogProps {
  user: { id: string; username: string; namaLengkap: string };
  open: boolean; // Tambahkan prop `open`
  onOpenChange: (isOpen: boolean) => void; // Tambahkan handler untuk mengontrol open state
  onSave: () => void;
}

export function EditUserDialog({
  user,
  open,
  onOpenChange,
  onSave,
}: EditUserDialogProps) {
  const [username, setUsername] = useState(user.username);
  const [namaLengkap, setNamaLengkap] = useState(user.namaLengkap);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!username || !namaLengkap) {
      setError('Username dan Nama tidak boleh kosong');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, namaLengkap }),
      });

      if (!res.ok) throw new Error('Gagal mengupdate user');

      onSave();
      onOpenChange(false); // Tutup dialog setelah sukses
    } catch {
      setError('Gagal mengupdate user');
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {error && <p className="text-red-500">{error}</p>}
          <div>
            <Label>Username</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <Label>Nama</Label>
            <Input
              value={namaLengkap}
              onChange={(e) => setNamaLengkap(e.target.value)}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
