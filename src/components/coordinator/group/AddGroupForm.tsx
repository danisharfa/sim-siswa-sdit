'use client';

import useSWR from 'swr';
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from '@/components/ui/card';
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
import { AddGroupSchema, AddGroupInput } from '@/lib/validations/group';

interface ActiveClassroom {
  id: string;
  name: string;
  academicYear: string;
  semester: Semester;
}

interface Props {
  onGroupAdded: () => void;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function AddGroupForm({ onGroupAdded }: Props) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<AddGroupInput>({
    resolver: zodResolver(AddGroupSchema),
    defaultValues: {
      groupName: '',
      classroomId: '',
      teacherId: '',
    },
  });

  const { data: classroomData } = useSWR('/api/coordinator/classroom/active', fetcher);
  const { data: teacherData } = useSWR('/api/coordinator/teacher', fetcher);

  const classroomOptions: ActiveClassroom[] = classroomData?.data || [];
  const teacherOptions: { id: string; nip: string; fullName: string }[] = teacherData?.data || [];

  async function onSubmit(values: AddGroupInput) {
    try {
      const res = await fetch('/api/coordinator/group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        toast.error(result.message || 'Gagal menambah kelompok');
        return;
      }

      toast.success(result.message || 'Kelompok berhasil ditambahkan');
      reset();
      onGroupAdded();
    } catch {
      toast.error('Terjadi kesalahan saat menyimpan data');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Tambah Kelompok Baru</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <CardContent>
          <FieldSet>
            <FieldGroup>
              <Controller
                name="groupName"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="groupName">Nama Kelompok</FieldLabel>
                    <Input
                      id="groupName"
                      placeholder="Contoh: Kelompok 1"
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </Field>
                )}
              />

              <Controller
                name="classroomId"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="classroom">Kelas Aktif</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="classroom" aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder="Pilih kelas aktif" />
                      </SelectTrigger>
                      <SelectContent>
                        {classroomOptions.map((kelas) => (
                          <SelectItem key={kelas.id} value={kelas.id}>
                            {kelas.name} - {kelas.academicYear} {kelas.semester}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </Field>
                )}
              />

              <Controller
                name="teacherId"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="teacher">Guru Pembimbing</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="teacher" aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder="Pilih guru pembimbing" />
                      </SelectTrigger>
                      <SelectContent>
                        {teacherOptions.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.fullName} - {t.nip}
                          </SelectItem>
                        ))}
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
              <span>Tambah Kelompok</span>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
