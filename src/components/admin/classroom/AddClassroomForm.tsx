'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Semester } from '@prisma/client';
import { AddClassroomSchema, AddClassroomInput } from '@/lib/validations/classroom';

interface Props {
  onClassroomAdded: () => void;
  defaultAcademicYear: string;
  defaultSemester: Semester;
}

export function AddClassroomForm({
  onClassroomAdded,
  defaultAcademicYear,
  defaultSemester,
}: Props) {
  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = useForm<AddClassroomInput>({
    resolver: zodResolver(AddClassroomSchema),
    defaultValues: {
      name: '',
      academicYear: defaultAcademicYear,
      semester: defaultSemester,
    },
  });

  async function onSubmit(values: AddClassroomInput) {
    try {
      const res = await fetch('/api/admin/classroom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        toast.error(data?.message || 'Gagal menambah kelas');
        return;
      }

      toast.success(data.message || 'Kelas berhasil ditambahkan');
      reset();
      onClassroomAdded();
    } catch {
      toast.error('Terjadi kesalahan saat mengirim data.');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Tambah Kelas</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <CardContent>
          <FieldSet>
            <FieldGroup>
              <Controller
                name="name"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="name">Nama Kelas</FieldLabel>
                    <Input
                      id="name"
                      placeholder="Contoh: 6 Ahmad"
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </Field>
                )}
              />

              <Controller
                name="academicYear"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="academicYear">Tahun Ajaran</FieldLabel>
                    <Input
                      id="academicYear"
                      placeholder="Contoh: 2024/2025"
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </Field>
                )}
              />

              <Controller
                name="semester"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="semester">Semester</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={(val) => field.onChange(val as Semester)}
                    >
                      <SelectTrigger
                        id="semester"
                        className="w-full"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="Pilih Semester" />
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

        <CardFooter>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner />
                <span>Menambahkan...</span>
              </>
            ) : (
              <span>Tambah Kelas</span>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
