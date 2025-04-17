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

export async function getGroupById(id: string) {
  try {
    return await prisma.kelompok.findUnique({
      where: { id },
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
