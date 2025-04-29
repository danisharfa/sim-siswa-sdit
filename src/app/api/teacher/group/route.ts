import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    const user = session?.user;

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const guru = await prisma.guruProfile.findUnique({
      where: { userId: user.id },
    });

    if (!guru) {
      return NextResponse.json({ success: false, error: 'Guru tidak ditemukan' }, { status: 404 });
    }

    const groups = await prisma.kelompok.findMany({
      where: {
        guruKelompok: {
          some: {
            guruId: guru.id,
          },
        },
      },
      include: {
        kelas: true,
        siswaProfiles: {
          select: { id: true }, // hanya ambil id untuk efisiensi
        },
      },
    });

    const formattedGroups = groups.map((group) => ({
      id: group.id,
      namaKelompok: group.namaKelompok,
      kelas: {
        namaKelas: group.kelas.namaKelas,
        tahunAjaran: group.kelas.tahunAjaran,
      },
      totalAnggota: group.siswaProfiles.length,
    }));

    return NextResponse.json({
      success: true,
      message: 'Data kelompok guru berhasil diambil',
      data: formattedGroups,
    });
  } catch (error) {
    console.error('Gagal mengambil kelompok guru:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil kelompok guru' },
      { status: 500 }
    );
  }
}
