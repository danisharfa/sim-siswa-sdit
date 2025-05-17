'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Semester } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const formSchema = z.object({
  currentYear: z.string().min(4, 'Tahun ajaran wajib diisi'),
  currentSemester: z.enum([Semester.GANJIL, Semester.GENAP]),
});

type FormValues = z.infer<typeof formSchema>;

interface AcademicSettingFormProps {
  data: {
    currentYear: string;
    currentSemester: Semester;
  };
  onSave: () => void;
}

export function AcademicSettingForm({ data, onSave }: AcademicSettingFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentYear: '',
      currentSemester: Semester.GANJIL,
    },
  });

  useEffect(() => {
    if (data) {
      form.reset(
        {
          currentYear: data.currentYear,
          currentSemester: data.currentSemester,
        },
        { keepDefaultValues: true }
      );
    }
  }, [data, form]);

  const isDirty = form.formState.isDirty;

  const onSubmit = async (values: FormValues) => {
    if (!isDirty) {
      toast.info('Tidak ada perubahan untuk disimpan.');
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
        toast.error(result.message || 'Gagal menyimpan pengaturan');
        return;
      }

      toast.success(result.message || 'Academic setting berhasil diperbarui');
      onSave(); // trigger refetch
      form.reset(values, { keepDefaultValues: true });
    } catch (error) {
      console.error('Error saving academic setting:', error);
      toast.error('Terjadi kesalahan saat menyimpan pengaturan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="text-lg">Pengaturan Tahun Ajaran & Semester Aktif</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentYear"
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
              name="currentSemester"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Semester</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih semester" />
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

            <Button type="submit" disabled={loading || !isDirty} className="w-full">
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
