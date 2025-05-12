import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const data = await prisma.surahJuz.findMany({
      select: {
        id: true,
        surahId: true,
        juzId: true,
        startVerse: true,
        endVerse: true,
        surah: {
          select: {
            id: true,
            name: true,
          },
        },
        juz: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { juzId: 'asc' },
    });

    return NextResponse.json({
      success: true,
      message: 'Berhasil mengambil daftar Surah Juz',
      data,
    });
  } catch (error) {
    console.error('[SURAHJUZ_GET]', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil daftar Surah Juz' },
      { status: 500 }
    );
  }
}
