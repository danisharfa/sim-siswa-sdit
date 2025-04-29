import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

type Params = Promise<{ id: string }>;

export async function GET(req: NextRequest, segmentData: { params: Params }) {
  const params = await segmentData.params;
  const id = params.id;

  const session = await auth();
  const user = session?.user;

  if (!user || user.role !== 'teacher') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
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

    const members = await prisma.siswaProfile.findMany({
      where: {
        kelompokId: id,
      },
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

    return NextResponse.json({
      success: true,
      message: 'Data anggota kelompok berhasil diambil',
      data: members,
    });
  } catch (error) {
    console.error('[GET Teacher Group Members]', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data siswa' },
      { status: 500 }
    );
  }
}
