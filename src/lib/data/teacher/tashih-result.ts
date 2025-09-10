import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function fetchTashihResult() {
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

    const results = await prisma.tashihResult.findMany({
      where: {
        tashihRequest: {
          teacherId: teacher.userId,
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
          },
        },
      },
    });

    const mappedResults = results.map((result) => ({
      ...result,
      tashihSchedule: {
        ...result.tashihSchedule,
        date:
          typeof result.tashihSchedule?.date === 'object' &&
          result.tashihSchedule?.date instanceof Date
            ? result.tashihSchedule.date.toISOString()
            : result.tashihSchedule?.date,
      },
    }));

    return mappedResults;
  } catch (error) {
    console.error('[FETCH_TASHIH_RESULT]', error);
    throw new Error('Gagal mengambil data hasil tashih');
  }
}
