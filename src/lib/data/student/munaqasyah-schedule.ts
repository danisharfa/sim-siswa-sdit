import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role } from '@prisma/client';

export async function fetchMunaqasyahSchedule() {
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

    const schedules = await prisma.munaqasyahSchedule.findMany({
      orderBy: { date: 'desc' },
      where: {
        scheduleRequests: {
          some: {
            request: {
              studentId: student.userId,
            },
          },
        },
      },
      include: {
        examiner: {
          select: {
            user: { select: { fullName: true } },
          },
        },
        scheduleRequests: {
          where: {
            request: {
              studentId: student.userId,
            },
          },
          include: {
            request: {
              select: {
                id: true,
                batch: true,
                stage: true,
                juz: { select: { name: true } },
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
        },
      },
    });

    return schedules.map((s) => ({
      ...s,
      date: s.date.toISOString(),
    }));
  } catch (error) {
    console.error('[FETCH_MUNAQASYAH_SCHEDULE]', error);
    throw new Error('Gagal mengambil data jadwal munaqasyah');
  }
}
