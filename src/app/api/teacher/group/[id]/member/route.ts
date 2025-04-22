import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ id: string }>;

export async function GET(req: NextRequest, segmentData: { params: Params }) {
  const params = await segmentData.params;
  const id = params.id;

  const user = await getUser();

  if (!user || user.role !== 'teacher') {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const guru = await prisma.guruProfile.findUnique({
      where: { userId: user.id },
    });

    if (!guru) {
      return NextResponse.json(
        { success: false, message: 'Guru tidak ditemukan' },
        { status: 404 }
      );
    }

    const isGroupBimbingan = await prisma.guruKelompok.findFirst({
      where: {
        kelompokId: id,
        guruId: guru.id,
      },
    });

    if (!isGroupBimbingan) {
      return NextResponse.json(
        { success: false, message: 'Kelompok ini bukan bimbingan Anda' },
        { status: 404 }
      );
    }

    const anggota = await prisma.siswaProfile.findMany({
      where: { kelompokId: params.id },
      select: {
        id: true,
        nis: true,
        user: {
          select: {
            namaLengkap: true,
          },
        },
      },
    });

    const formattedAnggota = anggota.map((siswa) => ({
      id: siswa.id,
      nis: siswa.nis,
      namaLengkap: siswa.user?.namaLengkap || 'Tidak diketahui',
    }));

    return NextResponse.json({
      success: true,
      message: 'Data anggota kelompok berhasil diambil',
      data: formattedAnggota,
    });
  } catch (error) {
    console.error('[GET Teacher Group Members]', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data siswa' },
      { status: 500 }
    );
  }
}
