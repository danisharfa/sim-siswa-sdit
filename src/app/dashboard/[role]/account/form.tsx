'use client';

import { useState, useRef, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { signOut } from 'next-auth/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from '@/components/ui/field';
import { InputGroup, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { getErrorMessage } from '@/lib/utils';
import { ChangePasswordInput, ChangePasswordSchema } from '@/lib/validations/auth';

export function ChangePasswordForm() {
  const [loading, setLoading] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
    },
  });

  const { handleSubmit, register, formState, reset, clearErrors, watch } = form;
  const { errors } = formState;

  const watchedValues = watch();
  const isFormEmpty = !watchedValues.oldPassword?.trim() || !watchedValues.newPassword?.trim();

  const onSubmit = async (values: ChangePasswordInput) => {
    setLoading(true);
    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
        signal: abortRef.current.signal,
      });

      const json = await res.json();
      if (json.success) {
        toast.success(json.message || 'Password berhasil diperbarui');
        reset();
        clearErrors();
        setTimeout(() => {
          signOut({ callbackUrl: '/' });
        }, 1000);
      } else {
        toast.error(json.message || 'Gagal memperbarui password');
      }
    } catch (error) {
      const message = getErrorMessage(error);
      console.error('Error:', message);
      toast.error(message || 'Terjadi kesalahan saat menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Ganti Password</CardTitle>
        <CardDescription>
          Masukkan password lama Anda untuk mengganti password. Jika lupa, hubungi admin.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <CardContent>
          <FieldSet>
            <FieldGroup>
              <Field data-invalid={!!errors.oldPassword}>
                <FieldLabel htmlFor="oldPassword">Password Lama</FieldLabel>

                <InputGroup>
                  <InputGroupInput
                    id="oldPassword"
                    type={showOld ? 'text' : 'password'}
                    placeholder="Masukkan password lama"
                    aria-invalid={!!errors.oldPassword}
                    {...register('oldPassword')}
                  />
                  <InputGroupButton
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setShowOld((p) => !p)}
                    tabIndex={-1}
                    aria-label={showOld ? 'Sembunyikan password lama' : 'Tampilkan password lama'}
                  >
                    {showOld ? <EyeOff /> : <Eye />}
                  </InputGroupButton>
                </InputGroup>

                <FieldError>{errors.oldPassword?.message}</FieldError>
              </Field>

              <Field data-invalid={!!errors.newPassword}>
                <FieldContent>
                  <FieldLabel htmlFor="newPassword">Password Baru</FieldLabel>
                  <FieldDescription>Password baru minimal 8 karakter</FieldDescription>
                </FieldContent>

                <InputGroup>
                  <InputGroupInput
                    id="newPassword"
                    type={showNew ? 'text' : 'password'}
                    placeholder="Masukkan password baru"
                    aria-invalid={!!errors.newPassword}
                    {...register('newPassword')}
                  />
                  <InputGroupButton
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setShowNew((p) => !p)}
                    tabIndex={-1}
                    aria-label={showNew ? 'Sembunyikan password baru' : 'Tampilkan password baru'}
                  >
                    {showNew ? <EyeOff /> : <Eye />}
                  </InputGroupButton>
                </InputGroup>

                <FieldError>{errors.newPassword?.message}</FieldError>
              </Field>
            </FieldGroup>
          </FieldSet>
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading || isFormEmpty}>
            {loading ? (
              <>
                <Spinner />
                Menyimpan...
              </>
            ) : (
              <span>Simpan</span>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
