import { z } from 'zod';

export const AddUserSchema = z.object({
  username: z.string().min(1, { message: 'Username wajib diisi' }, ),
  fullName: z.string().min(1, { message: 'Nama lengkap wajib diisi' }),
  role: z.enum(['coordinator', 'teacher', 'student'], { message: 'Role wajib dipilih' }),
});
export type AddUserInput = z.infer<typeof AddUserSchema>;