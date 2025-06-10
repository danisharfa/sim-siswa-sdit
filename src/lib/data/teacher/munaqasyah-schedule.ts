import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role } from '@prisma/client';

export async function fetchMunaqasyahSchedule() {
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

    const schedules = await prisma.munaqasyahSchedule.findMany({
      orderBy: { date: 'desc' },
      where: {
        OR: [
          // Jadwal sebagai examiner
          { examinerId: teacher.id },
          // Jadwal untuk request yang ditangani guru
          {
            scheduleRequests: {
              some: {
                request: {
                  teacherId: teacher.id,
                },
              },
            },
          },
        ],
      },
      include: {
        examiner: {
          include: {
            user: { select: { fullName: true } },
          },
        },
        scheduledByCoordinator: {
          include: {
            user: { select: { fullName: true } },
          },
        },
        scheduleRequests: {
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
                    nip: true,
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

    return schedules.map((schedule) => ({
      ...schedule,
      date: schedule.date.toISOString(),
      examiner: schedule.examiner
        ? {
            id: schedule.examiner.id,
            nip: schedule.examiner.nip,
            fullName: schedule.examiner.user.fullName,
          }
        : null,
      coordinator: schedule.scheduledByCoordinator
        ? {
            id: schedule.scheduledByCoordinator.id,
            nip: schedule.scheduledByCoordinator.nip,
            fullName: schedule.scheduledByCoordinator.user.fullName,
          }
        : null,
      scheduleRequests: schedule.scheduleRequests.map((sr) => ({
        id: sr.id,
        request: {
          ...sr.request,
          student: {
            nis: sr.request.student.nis,
            fullName: sr.request.student.user.fullName,
          },
          teacher: {
            nip: sr.request.teacher.nip,
            fullName: sr.request.teacher.user.fullName,
          },
        },
      })),
    }));
  } catch (error) {
    console.error('[FETCH_MUNAQASYAH_SCHEDULE]', error);
    throw new Error('Gagal mengambil data jadwal munaqasyah');
  }
}
