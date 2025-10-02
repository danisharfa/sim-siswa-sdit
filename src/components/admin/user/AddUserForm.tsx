'use client';

import { useEffect, useState, useActionState, useRef } from 'react';
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
  const [role, setRole] = useState<Role>(initialRole);
  const [state, formAction, isPending] = useActionState(addUserCredentials, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state) return;

    if (state.success) {
      toast.success(state.message);
      onUserAdded();
      setRole(initialRole);

      // Reset form
      if (formRef.current) {
        formRef.current.reset();
      }
    } else if (state.error) {
      const first = Object.values(state.error)[0]?.[0];
      toast.error(first || 'Validasi gagal');
    } else if (state.message && !state.success) {
      toast.error(state.message);
    }
  }, [state, onUserAdded]);

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Tambah Pengguna</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-4">
          <Input name="username" placeholder="Username" required />
          <Input name="fullName" placeholder="Nama Lengkap" required />

          {/* Hidden input untuk role */}
          <input type="hidden" name="role" value={role} />

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
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Menambahkan...
              </>
            ) : (
              <>
                <UserPlus2 />
                Tambah Pengguna
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
