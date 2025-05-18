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

export async function fetchGroupMembersForTeacher(groupId: string) {
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
      fullName: m.user?.fullName || 'Tidak diketahui',
    }));
  } catch (error) {
    console.error('[FETCH_GROUP_MEMBERS_ERROR]', error);
    throw new Error('Gagal mengambil data member kelompok binaan');
  }
}

export async function getStudentForTeacherGroup(groupId: string, studentId: string) {
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
      },
    });

    if (!student) return null;

    return {
      id: student.id,
      nis: student.nis,
      fullName: student.user.fullName,
    };
  } catch (error) {
    console.error('Error fetching student for teacher group:', error);
    return null;
  }
}
