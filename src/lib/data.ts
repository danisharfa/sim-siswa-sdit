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

export async function getUserById(id: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        siswaProfile: true,
        guruProfile: true,
      },
    });

    if (!user) return null;

    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      siswaProfile: user.siswaProfile
        ? {
            ...user.siswaProfile,
            createdAt: user.siswaProfile.createdAt.toISOString(),
            updatedAt: user.siswaProfile.updatedAt.toISOString(),
            tanggalLahir: user.siswaProfile.tanggalLahir.toISOString(),
          }
        : null,
      guruProfile: user.guruProfile
        ? {
            ...user.guruProfile,
            createdAt: user.guruProfile.createdAt.toISOString(),
            updatedAt: user.guruProfile.updatedAt.toISOString(),
            tanggalLahir: user.guruProfile.tanggalLahir.toISOString(),
          }
        : null,
    };
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}
