'use client';

import { useEffect, useState, useActionState } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { addUserCredentials } from '@/lib/actions';

interface Props {
  onUserAdded: () => void;
}

const initialRole = 'student';

export function AddUserForm({ onUserAdded }: Props) {
  const [role, setRole] = useState<'coordinator' | 'teacher' | 'student'>(initialRole);
  const [state, formAction] = useActionState(addUserCredentials, null);

  useEffect(() => {
    if (!state) return;

    if (state.success) {
      toast.success(state.message || 'User berhasil ditambah!');
      onUserAdded();
      setRole(initialRole);
    } else if (state.error) {
      const first = Object.values(state.error)[0]?.[0];
      toast.error(first || 'Validasi gagal');
    } else if (state.message && !state.success) {
      toast.error(state.message);
    }
  }, [state, onUserAdded]);

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set('role', role);
    await formAction(formData);
    setSubmitting(false);
  };

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Tambah User</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input name="username" placeholder="Username" required />
          <Input name="fullName" placeholder="Nama Lengkap" required />

          <Select
            value={role}
            onValueChange={(val) => setRole(val as 'coordinator' | 'teacher' | 'student')}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih role" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="coordinator">Koordinator</SelectItem>
                <SelectItem value="teacher">Guru</SelectItem>
                <SelectItem value="student">Siswa</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <CardFooter className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Simpan
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}
