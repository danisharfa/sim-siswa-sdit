import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const data = await prisma.surah.findMany({
      select: {
        id: true,
        nama: true,
        jumlahAyat: true,
      },
      orderBy: { id: 'asc' },
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('[SURAH_GET]', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil daftar surah' },
      { status: 500 }
    );
  }
}
