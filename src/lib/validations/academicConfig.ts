import { z } from 'zod';

export const AcademicPeriodSchema = z.object({
  currentYear: z.string().min(4, { message: 'Tahun ajaran wajib diisi' }),
  currentSemester: z.enum(['GANJIL', 'GENAP'], { message: 'Semester wajib dipilih' }),
});
export type AcademicPeriodInput = z.infer<typeof AcademicPeriodSchema>;


export const SchoolInfoSchema = z.object({
  currentPrincipalName: z.string().min(1, { message: 'Nama kepala sekolah wajib diisi' }),
  schoolName: z.string().min(1, { message: 'Nama sekolah wajib diisi' }),
  schoolAddress: z.string().min(1, { message: 'Alamat sekolah wajib diisi' }),
});

export type SchoolInfoInput = z.infer<typeof SchoolInfoSchema>;