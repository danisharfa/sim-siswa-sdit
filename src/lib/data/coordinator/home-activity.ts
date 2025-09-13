import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role } from '@prisma/client';

export async function fetchHomeActivityHistory() {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.coordinator) {
      throw new Error('Unauthorized');
    }

    const coordinator = await prisma.coordinatorProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!coordinator) {
      throw new Error('Profil koordinator tidak ditemukan');
    }

    // Coordinator melihat semua aktivitas rumah dari semua siswa
    const activities = await prisma.homeActivity.findMany({
      orderBy: { date: 'desc' },
      include: {
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
        surah: { select: { name: true } },
        juz: { select: { name: true } },
      },
    });

    return activities.map((activity) => ({
      ...activity,
      date: activity.date.toISOString(),
      student: {
        nis: activity.student.nis,
        fullName: activity.student.user.fullName,
      },
      group: {
        name: activity.group.name,
        classroom: {
          name: activity.group.classroom.name,
          academicYear: activity.group.classroom.academicYear,
          semester: activity.group.classroom.semester,
        },
      },
    }));
  } catch (error) {
    console.error('[COORDINATOR_FETCH_HOME_ACTIVITY_HISTORY]', error);
    throw new Error('Gagal mengambil data riwayat aktivitas rumah');
  }
}
