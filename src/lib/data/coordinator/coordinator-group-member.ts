import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function getGroupHistoryId(groupId: string) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    const coordinator = await prisma.coordinatorProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!coordinator) throw new Error('Koordinator tidak ditemukan');

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
            userId: true,
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
    console.error('Error fetching coordinator group:', error);
    return null;
  }
}
