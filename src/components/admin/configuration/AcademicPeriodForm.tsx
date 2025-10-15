'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Semester } from '@prisma/client';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import { AcademicPeriodSchema, AcademicPeriodInput } from '@/lib/validations/academicConfig';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';

interface Props {
  data: AcademicPeriodInput;
  onSave: () => void;
}

export function AcademicPeriodForm({ data, onSave }: Props) {
  const {
    handleSubmit,
    control,
    reset,
    formState: { isDirty, isSubmitting },
  } = useForm<AcademicPeriodInput>({
    resolver: zodResolver(AcademicPeriodSchema),
    defaultValues: data,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    reset(data);
  }, [data, reset]);

  async function onSubmit(values: AcademicPeriodInput) {
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

      toast.success('Tahun ajaran & semester berhasil diperbarui');
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
    <Card className="max-w-md h-full flex flex-col">
      <CardHeader>
        <CardTitle>Pengaturan Tahun Akademik</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 space-y-4" noValidate>
        <CardContent className="flex-1 space-y-4">
          <FieldSet>
            <FieldGroup>
              <Controller
                name="currentYear"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="currentYear">Tahun Ajaran</FieldLabel>
                    <Input
                      id="currentYear"
                      placeholder="Contoh: 2024/2025"
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </Field>
                )}
              />

              <Controller
                name="currentSemester"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="currentSemester">Semester</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={(val) => field.onChange(val as Semester)}
                    >
                      <SelectTrigger id="currentSemester" aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder="Pilih semester" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={Semester.GANJIL}>Ganjil</SelectItem>
                        <SelectItem value={Semester.GENAP}>Genap</SelectItem>
                      </SelectContent>
                    </Select>
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
