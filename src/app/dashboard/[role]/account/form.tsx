'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChangePasswordInput, ChangePasswordSchema } from '@/lib/validations/auth';
import { getErrorMessage } from '@/lib/utils';
import { signOut } from 'next-auth/react';

export function ChangePasswordForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
    },
  });

  const handleSubmit = async (values: ChangePasswordInput) => {
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(json.message || 'Password berhasil diubah');
        form.reset();
        setTimeout(() => {
          signOut({ callbackUrl: '/login' });
        }, 1000);
      } else {
        toast.error(json.message || 'Gagal mengubah password');
      }
    } catch (error) {
      const message = getErrorMessage(error);
      console.error('Error:', message);
      toast.error(message || 'Terjadi kesalahan saat menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Ganti Kata Sandi</CardTitle>
        <CardDescription>
          Masukkan kata sandi lama Anda untuk mengganti kata sandi. Jika lupa, hubungi admin.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="oldPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kata Sandi Lama</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Masukkan kata sandi lama" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kata Sandi Baru</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Masukkan kata sandi baru" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save />
                  Simpan
                </>
              )}
            </Button>
            {message && <p className="text-center text-sm">{message}</p>}
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
