import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

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

export async function getGroupById(id: string) {
  try {
    return await prisma.kelompok.findUnique({
      where: { id },
      include: {
        kelas: true,
      },
    });
  } catch (error) {
    console.error('Error fetching group data:', error);
    return null;
  }
}

export async function getUserDetail(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      siswaProfile: { include: { kelas: true } },
      guruProfile: true,
    },
  });

  if (!user) return null;

  if (user.siswaProfile) {
    return {
      id: user.id,
      namaLengkap: user.namaLengkap,
      role: 'student',
      nis: user.siswaProfile.nis,
      kelas: user.siswaProfile.kelas?.namaKelas || 'Belum ada kelas',
      jenisKelamin: user.siswaProfile.jenisKelamin,
      tanggalLahir: user.siswaProfile.tanggalLahir,
    };
  } else if (user.guruProfile) {
    return {
      id: user.id,
      namaLengkap: user.namaLengkap,
      role: 'teacher',
      nip: user.guruProfile.nip,
      jenisKelamin: user.guruProfile.jenisKelamin,
      tanggalLahir: user.guruProfile.tanggalLahir,
    };
  }

  return null;
}

export async function getGroupByIdForTeacher(id: string) {
  try {
    const user = await getUser();
    if (!user) return null;

    const guru = await prisma.guruProfile.findUnique({
      where: { userId: user.id },
    });

    if (!guru) return null;

    const group = await prisma.kelompok.findFirst({
      where: {
        id,
        guruKelompok: {
          some: {
            guruId: guru.id,
          },
        },
      },
      include: {
        kelas: true,
      },
    });

    return group;
  } catch (error) {
    console.error('Error fetching teacher group:', error);
    return null;
  }
}
