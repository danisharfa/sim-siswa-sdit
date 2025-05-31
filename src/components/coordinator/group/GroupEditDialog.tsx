'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface GroupEditDialogProps {
  group: { groupId: string; groupName: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function GroupEditDialog({ group, open, onOpenChange, onSave }: GroupEditDialogProps) {
  const [groupName, setGroupName] = useState(group.groupName);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setGroupName(group.groupName);
  }, [group]);

  async function handleSave() {
    setLoading(true);

    try {
      const res = await fetch(`/api/coordinator/group/${group.groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupName }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        toast.error(data?.message || 'Gagal mengedit kelompok');
        return;
      }

      toast.success(data.message || 'Kelompok berhasil diedit');
      onSave();
      onOpenChange(false);
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
          <DialogTitle>Edit Kelompok</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="groupName">Nama Kelompok</Label>
            <Input
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
