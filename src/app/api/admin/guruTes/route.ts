import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const guruTes = await prisma.guruTes.findMany({
      include: {
        guru: {
          include: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Data guru tes berhasil diambil',
      data: guruTes,
    });
  } catch (error) {
    console.error('Gagal mengambil data guru tes:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data guru tes' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { nip } = await req.json();

    const guru = await prisma.guruProfile.findUnique({ where: { nip } });

    if (!guru) {
      return NextResponse.json(
        {
          success: false,
          message: 'Guru dengan NIP tersebut tidak ditemukan',
        },
        { status: 404 }
      );
    }

    const newGuruTes = await prisma.guruTes.create({
      data: {
        guruId: guru.id,
        aktif: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Guru Tes berhasil dibuat',
      data: newGuruTes,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: 'Failed to create Guru Tes' },
      { status: 500 }
    );
  }
}
