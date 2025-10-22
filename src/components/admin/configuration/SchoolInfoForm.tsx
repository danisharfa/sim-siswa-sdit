'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import { SchoolInfoSchema, SchoolInfoInput } from '@/lib/validations/academicConfig';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';

interface Props {
  data: SchoolInfoInput;
  onSave: () => void;
}

export function SchoolInfoForm({ data, onSave }: Props) {
  const {
    handleSubmit,
    control,
    reset,
    formState: { isDirty, isSubmitting },
  } = useForm<SchoolInfoInput>({
    resolver: zodResolver(SchoolInfoSchema),
    defaultValues: data,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    reset(data);
  }, [data, reset]);

  async function onSubmit(values: SchoolInfoInput) {
    if (!isDirty) {
      toast.info('Tidak ada perubahan.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/configuration', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        toast.error(result.message || 'Gagal menyimpan');
        return;
      }

      toast.success('Informasi sekolah berhasil diperbarui');
      onSave();
      reset(values);
    } catch (error) {
      console.error(error);
      toast.error('Terjadi kesalahan saat menyimpan data');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="">
      <CardHeader>
        <CardTitle>Informasi Sekolah</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 space-y-4" noValidate>
        <CardContent className="flex-1">
          <FieldSet>
            <FieldGroup>
              <Controller
                name="schoolName"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="schoolName">Nama Sekolah</FieldLabel>
                    <Input id="schoolName" aria-invalid={fieldState.invalid} {...field} />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </Field>
                )}
              />

              <Controller
                name="schoolAddress"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="schoolAddress">Alamat Sekolah</FieldLabel>
                    <Input id="schoolAddress" aria-invalid={fieldState.invalid} {...field} />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </Field>
                )}
              />

              <Controller
                name="currentPrincipalName"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="currentPrincipalName">Nama Kepala Sekolah</FieldLabel>
                    <Input id="currentPrincipalName" aria-invalid={fieldState.invalid} {...field} />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </Field>
                )}
              />
            </FieldGroup>
          </FieldSet>
        </CardContent>

        <CardFooter className="mt-auto pt-4">
          <Button type="submit" disabled={loading || !isDirty || isSubmitting} className="w-full">
            {loading || isSubmitting ? (
              <>
                <Spinner />
                Menyimpan...
              </>
            ) : (
              <>
                <Save />
                Simpan Perubahan
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
