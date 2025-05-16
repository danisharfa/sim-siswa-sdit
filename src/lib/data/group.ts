import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function getGroupById(id: string) {
  try {
    return await prisma.group.findUnique({
      where: { id },
      include: {
        classroom: true,
      },
    });
  } catch (error) {
    console.error('Error fetching group data:', error);
    return null;
  }
}

export async function getGroupByIdForTeacher(id: string) {
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
