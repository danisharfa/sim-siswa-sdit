'use client';

import { Card, CardHeader, CardContent, CardTitle, CardFooter } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
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
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AddUserSchema, AddUserInput } from '@/lib/validations/user';

interface Props {
  onUserAdded: () => void;
}

export function AddUserForm({ onUserAdded }: Props) {
  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = useForm<AddUserInput>({
    resolver: zodResolver(AddUserSchema),
    defaultValues: {
      username: '',
      fullName: '',
      role: 'student',
    },
  });

  async function onSubmit(values: AddUserInput) {
    try {
      const res = await fetch('/api/admin/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        toast.error(data?.message || 'Gagal menambah pengguna');
        return;
      }

      toast.success(data.message || 'Pengguna berhasil ditambah');
      reset({ username: '', fullName: '', role: 'student' });
      onUserAdded();
    } catch {
      toast.error('Terjadi kesalahan saat mengirim data.');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Tambah Pengguna</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <CardContent>
          <FieldSet>
            <FieldGroup>
              <Controller
                name="username"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="username">Username</FieldLabel>
                    <Input
                      id="username"
                      placeholder="Contoh: 2025001"
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </Field>
                )}
              />
              <Controller
                name="fullName"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="fullName">Nama Lengkap</FieldLabel>
                    <Input id="fullName" aria-invalid={fieldState.invalid} {...field} />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </Field>
                )}
              />
              <Controller
                name="role"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="role-select">Peran</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="role-select"
                        className="w-full"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="coordinator">Koordinator</SelectItem>
                          <SelectItem value="teacher">Guru</SelectItem>
                          <SelectItem value="student">Siswa</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </Field>
                )}
              />
            </FieldGroup>
          </FieldSet>
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner />
                Menambahkan...
              </>
            ) : (
              <>Tambah Pengguna</>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
