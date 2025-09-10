import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function fetchTashihResult() {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.student) {
      throw new Error('Unauthorized');
    }

    const student = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!student) {
      throw new Error('Profil siswa tidak ditemukan');
    }

    const results = await prisma.tashihResult.findMany({
      where: {
        tashihRequest: {
          studentId: student.userId,
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        tashihSchedule: {
          select: {
            id: true,
            date: true,
            sessionName: true,
            startTime: true,
            endTime: true,
            location: true,
          },
        },
        tashihRequest: {
          select: {
            tashihType: true,
            startPage: true,
            endPage: true,
            teacher: {
              select: {
                user: { select: { fullName: true } },
              },
            },
            group: {
              select: {
                name: true,
                classroom: {
                  select: {
                    name: true,
                    academicYear: true,
                    semester: true,
                  },
                },
              },
            },
            juz: { select: { id: true, name: true } },
            surah: { select: { id: true, name: true } },
            wafa: { select: { id: true, name: true } },
          },
        },
      },
    });

    return results.map((r) => ({
      ...r,
      tashihSchedule: {
        ...r.tashihSchedule,
        date: new Date(r.tashihSchedule.date).toISOString(),
      },
    }));
  } catch (error) {
    console.error('[FETCH_TASHIH_RESULT]', error);
    throw new Error('Gagal mengambil data hasil tashih');
  }
}
