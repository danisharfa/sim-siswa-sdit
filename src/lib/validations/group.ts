import { z } from 'zod';

export const AddGroupSchema = z.object({
  groupName: z.string().min(1, { message: 'Nama kelompok wajib diisi' }),
  classroomId: z.string().min(1, { message: 'Kelas wajib dipilih' }),
  teacherId: z.string().min(1, { message: 'Guru pembimbing wajib dipilih' }),
});
export type AddGroupInput = z.infer<typeof AddGroupSchema>;

export const AddMemberSchema = z.object({
  nis: z.string().min(1, { message: 'NIS wajib diisi' }),
});
export type AddMemberInput = z.infer<typeof AddMemberSchema>;
