import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role } from '@prisma/client';

export async function fetchMunaqasyahResult() {
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

    const results = await prisma.munaqasyahResult.findMany({
      orderBy: { createdAt: 'desc' },
      where: {
        request: {
          studentId: student.id,
        },
      },
      include: {
        request: {
          select: {
            id: true,
            batch: true,
            stage: true,
            status: true,
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
        schedule: {
          select: {
            date: true,
            sessionName: true,
            startTime: true,
            endTime: true,
            location: true,
            examiner: {
              select: {
                user: { select: { fullName: true } },
              },
            },
          },
        },
        tasmi: {
          select: {
            tajwid: true,
            kelancaran: true,
            adab: true,
            note: true,
            totalScore: true,
          },
        },
        munaqasyah: {
          select: {
            tajwid: true,
            kelancaran: true,
            adab: true,
            note: true,
            totalScore: true,
          },
        },
      },
    });

    return results.map((result) => ({
      ...result,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
      schedule: {
        ...result.schedule,
        date: result.schedule.date.toISOString(),
      },
    }));
  } catch (error) {
    console.error('[FETCH_MUNAQASYAH_RESULT]', error);
    throw new Error('Gagal mengambil data hasil munaqasyah');
  }
}