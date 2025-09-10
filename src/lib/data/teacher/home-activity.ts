import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role } from '@prisma/client';

export async function fetchHomeActivityHistory() {
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

    // Ambil semua siswa yang dibimbing guru
    const groups = await prisma.group.findMany({
      where: { teacherId: teacher.userId },
      include: {
        students: true,
        classroom: true,
      },
    });

    // Kumpulkan ID siswa dari semua kelompok
    const studentIds = groups.flatMap((group) => group.students.map((student) => student.userId));

    if (studentIds.length === 0) {
      return [];
    }

    const activities = await prisma.homeActivity.findMany({
      where: {
        studentId: {
          in: studentIds,
        },
      },
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
    console.error('[FETCH_HOME_ACTIVITY_HISTORY]', error);
    throw new Error('Gagal mengambil data riwayat aktivitas rumah');
  }
}

// Fungsi untuk mengambil statistik aktivitas
// export async function fetchHomeActivityStatistics() {
//   try {
//     const session = await auth();
//     if (!session || session.user.role !== Role.teacher) {
//       throw new Error('Unauthorized');
//     }

//     const teacher = await prisma.teacherProfile.findUnique({
//       where: { userId: session.user.id },
//     });
//     if (!teacher) {
//       throw new Error('Profil guru tidak ditemukan');
//     }

//     // Ambil semua siswa yang dibimbing guru
//     const teacherGroups = await prisma.teacherGroup.findMany({
//       where: { teacherId: teacher.id },
//       include: {
//         group: {
//           include: {
//             students: true,
//           },
//         },
//       },
//     });

//     const studentIds = teacherGroups.flatMap((tg) =>
//       tg.group.students.map((student) => student.id)
//     );

//     if (studentIds.length === 0) {
//       return {
//         totalActivities: 0,
//         totalStudents: 0,
//         activitiesByType: [],
//         recentActivities: [],
//       };
//     }

//     // Total aktivitas
//     const totalActivities = await prisma.homeActivity.count({
//       where: {
//         studentId: {
//           in: studentIds,
//         },
//       },
//     });

//     // Aktivitas berdasarkan tipe
//     const activitiesByType = await prisma.homeActivity.groupBy({
//       by: ['activityType'],
//       where: {
//         studentId: {
//           in: studentIds,
//         },
//       },
//       _count: {
//         id: true,
//       },
//     });

//     // Aktivitas terbaru (5 terakhir)
//     const recentActivities = await prisma.homeActivity.findMany({
//       where: {
//         studentId: {
//           in: studentIds,
//         },
//       },
//       orderBy: { date: 'desc' },
//       take: 5,
//       include: {
//         student: {
//           select: {
//             nis: true,
//             user: { select: { fullName: true } },
//           },
//         },
//         surah: { select: { name: true } },
//         juz: { select: { name: true } },
//       },
//     });

//     return {
//       totalActivities,
//       totalStudents: studentIds.length,
//       activitiesByType: activitiesByType.map((item) => ({
//         activityType: item.activityType,
//         count: item._count.id,
//       })),
//       recentActivities: recentActivities.map((activity) => ({
//         ...activity,
//         date: activity.date.toISOString(),
//         student: {
//           nis: activity.student.nis,
//           fullName: activity.student.user.fullName,
//         },
//       })),
//     };
//   } catch (error) {
//     console.error('[FETCH_HOME_ACTIVITY_STATISTICS]', error);
//     throw new Error('Gagal mengambil statistik aktivitas rumah');
//   }
// }
