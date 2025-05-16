import { prisma } from '@/lib/prisma';

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
