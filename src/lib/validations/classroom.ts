import { z } from 'zod';

export const AddClassroomSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Nama kelas wajib diisi' })
    .refine(
      (val) => {
        const trimmed = val.trim();
        const firstChar = trimmed.charAt(0);
        return ['1', '2', '3', '4', '5', '6'].includes(firstChar);
      },
      { message: 'Nama kelas harus diawali dengan angka 1, 2, 3, 4, 5, atau 6' }
    )
    .refine(
      (val) => {
        const trimmed = val.trim();
        const restOfString = trimmed.substring(1);
        return !/\d/.test(restOfString);
      },
      { message: 'Nama kelas tidak boleh mengandung angka setelah karakter pertama' }
    ),
  academicYear: z.string().min(4, { message: 'Tahun ajaran wajib diisi' }),
  semester: z.enum(['GANJIL', 'GENAP'], { message: 'Semester wajib dipilih' }),
});
export type AddClassroomInput = z.infer<typeof AddClassroomSchema>;

export const AddMemberSchema = z.object({
  nis: z.string().min(1, { message: 'NIS wajib diisi' }),
});
export type AddMemberInput = z.infer<typeof AddMemberSchema>;
