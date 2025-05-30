import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role } from '@prisma/client';

export async function fetchTashihSchedule() {
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

    const schedules = await prisma.tashihSchedule.findMany({
      orderBy: { date: 'desc' },
      where: {
        schedules: {
          some: {
            tashihRequest: {
              studentId: student.id,
            },
          },
        },
      },
      include: {
        schedules: {
          where: {
            tashihRequest: {
              studentId: student.id,
            },
          },
          include: {
            tashihRequest: {
              select: {
                id: true,
                status: true,
                tashihType: true,
                surah: { select: { name: true } },
                juz: { select: { name: true } },
                wafa: { select: { name: true } },
                startPage: true,
                endPage: true,
                academicYear: true,
                semester: true,
                classroomName: true,
                groupName: true,
                student: {
                  select: {
                    nis: true,
                    user: { select: { fullName: true } },
                  },
                },
                teacher: {
                  select: {
                    user: { select: { fullName: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    return schedules.map((s) => ({
      ...s,
      date: s.date.toISOString(),
    }));
  } catch (error) {
    console.error('[FETCH_TASHIH_SCHEDULE]', error);
    throw new Error('Gagal mengambil data jadwal tashih');
  }
}
