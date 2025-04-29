import { prisma } from '@/lib/prisma';

export async function getClassroomById(id: string) {
  try {
    return await prisma.kelas.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error('Error fetching classroom data:', error);
    return null;
  }
}
