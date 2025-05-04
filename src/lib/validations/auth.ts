import { z } from 'zod';

export const LogInSchema = z.object({
  username: z.string().min(1, { message: 'Username wajib diisi' }),
  password: z.string().min(1, { message: 'Kata sandi wajib diisi' }),
});

export const AddUserSchema = z.object({
  username: z.string().min(1, { message: 'Username wajib diisi' }),
  fullName: z.string().min(1, { message: 'Nama lengkap wajib diisi' }),
  role: z.enum(['coordinator', 'teacher', 'student'], {
    errorMap: () => ({ message: 'Peran wajib dipilih' }),
  }),
});

export const ChangePasswordSchema = z.object({
  oldPassword: z.string().min(1, { message: 'Kata sandi lama wajib diisi.' }),
  newPassword: z.string().min(8, { message: 'Kata sandi baru minimal 8 karakter' }),
});
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
