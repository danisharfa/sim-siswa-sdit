import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const data = await prisma.surahJuz.findMany({
      select: {
        id: true,
        juz: true,
        surahId: true,
        ayatAwal: true,
        ayatAkhir: true,
      },
      orderBy: { id: 'asc' },
    });

    return NextResponse.json({
      success: true,
      message: 'Berhasil mengambil daftar surah juz',
      data,
    });
  } catch (error) {
    console.error('[SURAHJUZ_GET]', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil daftar surah juz' },
      { status: 500 }
    );
  }
}
