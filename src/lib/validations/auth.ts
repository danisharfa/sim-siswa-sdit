import { z } from 'zod';

export const LogInSchema = z.object({
  username: z.string().min(1, { message: 'Username wajib diisi' }),
  password: z.string().min(1, { message: 'Password wajib diisi' }),
});

export const AddUserSchema = z.object({
  username: z.string().min(1, { message: 'Username wajib diisi' }),
  fullName: z.string().min(1, { message: 'Nama lengkap wajib diisi' }),
  role: z.enum(['coordinator', 'teacher', 'student'], {
    errorMap: () => ({ message: 'Peran wajib dipilih' }),
  }),
});

export const ChangePasswordSchema = z.object({
  oldPassword: z.string().min(1, { message: 'Password lama wajib diisi.' }),
  newPassword: z.string().min(8, { message: 'Password baru minimal 8 karakter' }),
});
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
