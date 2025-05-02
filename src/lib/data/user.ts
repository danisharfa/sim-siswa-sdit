import { prisma } from '@/lib/prisma';

export async function getUserDetail(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      student: { include: { classroom: true } },
      teacher: true,
    },
  });

  if (!user) return null;

  if (user.student) {
    return {
      id: user.id,
      namaLengkap: user.fullName,
      role: 'student',
      nis: user.student.nis,
      classroom: user.student.classroom?.name || 'Belum ada kelas',
      gender: user.student.gender,
      birthDate: user.student.birthDate,
    };
  } else if (user.teacher) {
    return {
      id: user.id,
      fullName: user.fullName,
      role: 'teacher',
      nip: user.teacher.nip,
      gender: user.teacher.gender,
      birthDate: user.teacher.birthDate,
    };
  }

  return null;
}
