import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function getGroupId(id: string) {
  try {
    const session = await auth();

    if (!session?.user) return null;

    const guru = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!guru) return null;

    const group = await prisma.group.findFirst({
      where: {
        id,
        teacherGroups: {
          some: {
            teacherId: guru.id,
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
