'use client';

import { useEffect, useState, useActionState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus2 } from 'lucide-react';
import { toast } from 'sonner';
import { addUserCredentials } from '@/lib/actions';
import { Role } from '@prisma/client';

interface Props {
  onUserAdded: () => void;
}

const initialRole = Role.student;

export function AddUserForm({ onUserAdded }: Props) {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<Role>(initialRole);
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    formData.set('role', role);

    await formAction(formData);

    setLoading(false);
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

          <Select value={role} onValueChange={(val) => setRole(val as Role)}>
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

          <Button
            type="submit"
            className="w-full flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Menambahkan...
              </>
            ) : (
              <>
                <UserPlus2 />
                Tambah User
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
