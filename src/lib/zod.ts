import { object, string, enum as zEnum } from 'zod';

export const LogInSchema = object({
  username: string().min(1, { message: 'Username is required' }),
  password: string().min(1, { message: 'Password is required' }),
});

export const AddUserSchema = object({
  username: string().min(1, { message: 'Username is required' }),
  namaLengkap: string().min(1, { message: 'Nama Lengkap is required' }),
  role: zEnum(['teacher', 'student'], {
    errorMap: () => ({ message: 'Role harus teacher atau student' }),
  }),
});

export const ChangePasswordSchema = object({
  oldPassword: string().min(6, { message: 'Kata sandi lama minimal 6 karakter.' }),
  newPassword: string().min(6, { message: 'Kata sandi baru minimal 6 karakter.' }),
});
