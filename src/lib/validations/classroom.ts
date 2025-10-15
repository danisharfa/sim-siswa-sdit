import { z } from 'zod';

export const AddClassroomSchema = z.object({
  name: z.string().min(1, { message: 'Nama kelas wajib diisi' }),
  academicYear: z.string().min(4, { message: 'Tahun ajaran wajib diisi' }),
  semester: z.enum(['GANJIL', 'GENAP'], { message: 'Semester wajib dipilih' }),
});
export type AddClassroomInput = z.infer<typeof AddClassroomSchema>;

export const AddMemberSchema = z.object({
  nis: z.string().min(1, { message: 'NIS wajib diisi' }),
});
export type AddMemberInput = z.infer<typeof AddMemberSchema>;
