import { z } from 'zod';

export const AddGroupSchema = z.object({
  groupName: z.string().min(1, 'Nama kelompok wajib diisi'),
  classroomName: z.string().min(1, 'Nama kelas wajib diisi'),
  classroomAcademicYear: z.string().min(1, 'Tahun ajaran wajib diisi'),
  classroomSemester: z.enum(['GANJIL', 'GENAP'], {
    required_error: 'Semester wajib dipilih',
  }),
  nip: z.string().min(1, 'NIP wajib diisi'),
});
export type AddGroupInput = z.infer<typeof AddGroupSchema>;

export const AddMemberSchema = z.object({
  nis: z.string().min(1, 'NIS wajib diisi'),
});
export type AddMemberInput = z.infer<typeof AddMemberSchema>;
