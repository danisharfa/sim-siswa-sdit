import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function getGroupId(groupId: string) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!teacher) throw new Error('Guru tidak ditemukan');

    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        teacherGroups: {
          some: {
            teacherId: teacher.id,
          },
        },
      },
      include: {
        classroom: true,
      },
    });

    return group;
  } catch (error) {
    console.error('Error fetching teacher group:', error);
    return null;
  }
}

export async function fetchGroupMembers(groupId: string) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!teacher) throw new Error('Guru tidak ditemukan');

    const isGroupBimbingan = await prisma.teacherGroup.findFirst({
      where: {
        groupId,
        teacherId: teacher.id,
      },
    });
    if (!isGroupBimbingan) throw new Error('Kelompok ini bukan bimbingan Anda');

    const members = await prisma.studentProfile.findMany({
      where: { groupId },
      orderBy: { nis: 'asc' },
      select: {
        id: true,
        nis: true,
        user: {
          select: { fullName: true },
        },
      },
    });

    return members.map((m) => ({
      id: m.id,
      nis: m.nis,
      fullName: m.user.fullName
    }));
  } catch (error) {
    console.error('[FETCH_GROUP_MEMBERS_ERROR]', error);
    throw new Error('Gagal mengambil data member kelompok binaan');
  }
}

export async function getStudent(groupId: string, studentId: string) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!teacher) throw new Error('Guru tidak ditemukan');

    const student = await prisma.studentProfile.findFirst({
      where: {
        id: studentId,
        groupId: groupId,
      },
      select: {
        id: true,
        nis: true,
        user: {
          select: {
            fullName: true,
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
    });

    if (!student) return null;

    return student;
  } catch (error) {
    console.error('Error fetching student group:', error);
    return null;
  }
}

export async function getGroupHistoryId(groupId: string) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!teacher) throw new Error('Guru tidak ditemukan');

    const group = await prisma.groupHistory.findFirst({
      where: {
        groupId,
      },
      include: {
        group: {
          include: {
            classroom: true,
          },
        },
        student: {
          select: {
            id: true,
            nis: true,
            user: {
              select: { fullName: true },
            },
          },
        },
      },
    });

    return group;
  } catch (error) {
    console.error('Error fetching teacher group:', error);
    return null;
  }
}

export async function fetchGroupHistoryMembers(groupId: string) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!teacher) throw new Error('Guru tidak ditemukan');

    // Ambil semua groupHistory dengan groupId ini
    const groupHistories = await prisma.groupHistory.findMany({
      where: { groupId },
      orderBy: { student: { nis: 'asc' } },
      include: {
        group: {
          include: {
            teacherGroups: true,
          },
        },
        student: {
          select: {
            id: true,
            nis: true,
            user: {
              select: { fullName: true },
            },
          },
        },
      },
    });

    if (!groupHistories || groupHistories.length === 0)
      throw new Error('Group history tidak ditemukan');

    const isGroupBimbingan = await prisma.teacherGroup.findFirst({
      where: {
        groupId,
        teacherId: teacher.id,
      },
    });
    if (!isGroupBimbingan) throw new Error('Kelompok ini bukan bimbingan Anda');

   // Ambil student unik berdasarkan ID
    const uniqueStudents = new Map<string, { id: string; nis: string; fullName: string }>();
    for (const history of groupHistories) {
      const student = history.student;
      if (student) {
        uniqueStudents.set(student.id, {
          id: student.id,
          nis: student.nis,
          fullName: student.user.fullName,
        });
      }
    }

    return Array.from(uniqueStudents.values());
  } catch (error) {
    console.error('[FETCH_GROUP_HISTORY_MEMBERS_ERROR]', error);
    throw new Error('Gagal mengambil data member group history');
  }
}
