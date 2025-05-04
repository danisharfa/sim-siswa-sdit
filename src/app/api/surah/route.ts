import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const data = await prisma.surah.findMany({
      select: {
        id: true,
        name: true,
        verseCount: true,
      },
      orderBy: { id: 'desc' },
    });

    return NextResponse.json({
      success: true,
      message: 'Berhasil mengambil daftar surah',
      data,
    });
  } catch (error) {
    console.error('[SURAH_GET]', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil daftar surah' },
      { status: 500 }
    );
  }
}
