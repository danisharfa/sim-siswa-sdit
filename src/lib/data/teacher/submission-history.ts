import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role } from '@prisma/client';

export async function fetchSubmissionHistory() {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.teacher) {
      throw new Error('Unauthorized');
    }

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!teacher) {
      throw new Error('Profil guru tidak ditemukan');
    }

    const kelompokBinaan = await prisma.group.findMany({
      where: { teacherId: teacher.userId },
      select: { id: true },
    });

    const groupIds = kelompokBinaan.map((item) => item.id);

    const submissionList = await prisma.submission.findMany({
      where: {
        teacherId: teacher.userId,
        groupId: {
          in: groupIds,
        },
      },
      orderBy: {
        date: 'desc',
      },
      include: {
        surah: { select: { id: true, name: true } },
        juz: { select: { id: true, name: true } },
        wafa: { select: { id: true, name: true } },
        student: {
          select: {
            nis: true,
            user: { select: { fullName: true } },
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            classroom: {
              select: { name: true, academicYear: true, semester: true },
            },
          },
        },
      },
    });

    return submissionList.map((s) => ({
      ...s,
      date: s.date.toISOString(),
    }));
  } catch (error) {
    console.error('[FETCH_SUBMISSION_HISTORY]', error);
    throw new Error('Gagal mengambil data riwayat setoran');
  }
}
