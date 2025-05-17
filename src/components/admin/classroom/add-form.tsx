'use client';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
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
  const form = useForm<AddClassroomInput>({
    resolver: zodResolver(AddClassroomSchema),
    defaultValues: {
      name: '',
      academicYear: defaultAcademicYear,
      semester: defaultSemester,
    },
  });

  const loading = form.formState.isSubmitting;

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
      form.reset({
        name: '',
        academicYear: defaultAcademicYear,
        semester: defaultSemester,
      });
      onClassroomAdded();
    } catch {
      toast.error('Terjadi kesalahan saat mengirim data.');
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Tambah Kelas Baru</h2>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Kelas</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: 6 Ahmad" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="academicYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tahun Ajaran</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: 2024/2025" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="semester"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Semester</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih Semester" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={Semester.GANJIL}>Ganjil</SelectItem>
                      <SelectItem value={Semester.GENAP}>Genap</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span>Menambahkan...</span>
                </>
              ) : (
                <span>Tambah Kelas</span>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
