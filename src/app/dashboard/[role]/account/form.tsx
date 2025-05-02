'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChangePasswordSchema } from '@/lib/zod';
import { z } from 'zod';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';

export function ChangePasswordForm({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const form = useForm<z.infer<typeof ChangePasswordSchema>>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
    },
  });

  const handleSubmit = async (values: z.infer<typeof ChangePasswordSchema>) => {
    setLoading(true);
    setMessage('');

    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...values }),
    });

    if (res.ok) {
      setMessage('✅ Kata sandi berhasil diubah!');
    } else {
      setMessage('❌ Gagal mengubah kata sandi. Silakan coba lagi.');
    }
    setLoading(false);
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
