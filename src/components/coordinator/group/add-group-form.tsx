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
import { AddGroupSchema, AddGroupInput } from '@/lib/validations/group';
import { Semester } from '@prisma/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Props {
  onGroupAdded: () => void;
}

export function AddGroupForm({ onGroupAdded }: Props) {
  const form = useForm<AddGroupInput>({
    resolver: zodResolver(AddGroupSchema),
    defaultValues: {
      groupName: '',
      classroomName: '',
      classroomAcademicYear: '',
      classroomSemester: Semester.GANJIL,
      nip: '',
    },
  });

  const isLoading = form.formState.isSubmitting;

  async function onSubmit(values: AddGroupInput) {
    try {
      const res = await fetch('/api/coordinator/group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        toast.error(data?.message || 'Gagal menambah kelompok');
        return;
      }

      toast.success(data.message || 'Kelompok berhasil ditambahkan');
      form.reset();
      onGroupAdded();
    } catch {
      toast.error('Terjadi kesalahan saat mengirim data.');
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Tambah Kelompok Baru</h2>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="groupName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Kelompok</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Kelompok 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="classroomName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Kelas</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: 1 AHMAD" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="classroomAcademicYear"
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
              name="classroomSemester"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Semester</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih Semester" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GANJIL">Ganjil</SelectItem>
                        <SelectItem value="GENAP">Genap</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NIP Wali Kelompok</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: 1234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Menambahkan...' : 'Tambah Kelompok'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
