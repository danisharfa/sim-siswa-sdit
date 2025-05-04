'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface UserEditDialogProps {
  user: { id: string; username: string; fullName: string };
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: () => void;
}

export function UserEditDialog({ user, open, onOpenChange, onSave }: UserEditDialogProps) {
  const [username, setUsername] = useState(user.username);
  const [fullName, setFullName] = useState(user.fullName);
  const [loading, setLoading] = useState(false);

  const isUnchanged = username === user.username && fullName === user.fullName;
  const isEmpty = !username.trim() || !fullName.trim();

  async function handleEdit() {
    if (isEmpty || isUnchanged) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/user/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, fullName }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(json.message || 'User berhasil diperbarui!');
        onSave();
        onOpenChange(false);
      } else {
        toast.error(json.message || 'Terjadi kesalahan saat menyimpan.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="fullName">Nama</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
