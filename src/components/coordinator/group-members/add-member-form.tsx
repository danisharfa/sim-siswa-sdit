'use client';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { AddMemberSchema, AddMemberInput } from '@/lib/validations/group';

interface Props {
  groupId: string;
  onMemberAdded: () => void;
}

export function AddMemberForm({ groupId, onMemberAdded }: Props) {
  const form = useForm<AddMemberInput>({
    resolver: zodResolver(AddMemberSchema),
    defaultValues: {
      nis: '',
    },
  });

  const isLoading = form.formState.isSubmitting;

  async function onSubmit(values: AddMemberInput) {
    try {
      const res = await fetch(`/api/coordinator/group/${groupId}/member`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const result = await res.json().catch(() => null);

      if (!res.ok || !result?.success) {
        toast.error(result?.message || 'Gagal menambahkan siswa');
        return;
      }

      toast.success(result.message || 'Siswa berhasil ditambahkan!');
      form.reset();
      onMemberAdded();
    } catch {
      toast.error('Terjadi kesalahan, coba lagi.');
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Tambah Siswa ke Kelompok</h2>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NIS Siswa</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan NIS" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Menambahkan...' : 'Tambah Siswa'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
