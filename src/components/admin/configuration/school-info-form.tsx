'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const formSchema = z.object({
  currentPrincipalName: z.string().optional(),
  schoolName: z.string().optional(),
  schoolAddress: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function SchoolInfoForm({ data, onSave }: {
  data: FormValues;
  onSave: () => void;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: data,
  });

  const [loading, setLoading] = useState(false);
  const isDirty = form.formState.isDirty;

  useEffect(() => {
    form.reset(data);
  }, [data, form]);

  const onSubmit = async (values: FormValues) => {
    if (!isDirty) return toast.info('Tidak ada perubahan.');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/configuration', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        return toast.error(result.message || 'Gagal menyimpan');
      }
      toast.success('Info sekolah berhasil diperbarui');
      onSave();
      form.reset(values);
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Informasi Sekolah</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentPrincipalName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Kepala Sekolah</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="schoolName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Sekolah</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="schoolAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat Sekolah</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
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
