import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const data = await prisma.juz.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        id: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Berhasil mengambil daftar Juz',
      data,
    });
  } catch (error) {
    console.error('[JUZ_GET]', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil daftar Juz' },
      { status: 500 }
    );
  }
}
