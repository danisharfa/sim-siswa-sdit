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
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AddClassroomSchema, AddClassroomInput } from '@/lib/validations/classroom';

interface Props {
  onClassroomAdded: () => void;
}

export function AddClassroomForm({ onClassroomAdded }: Props) {
  const form = useForm<AddClassroomInput>({
    resolver: zodResolver(AddClassroomSchema),
    defaultValues: {
      name: '',
      academicYear: '',
    },
  });

  const isLoading = form.formState.isSubmitting;

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
      form.reset();
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Menambahkan...' : 'Tambah Kelas'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
