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
      message: 'Daftar Juz berhasil diambil',
      data,
    });
  } catch (error) {
    console.error('Gagal mengambil daftar Juz:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil daftar Juz' },
      { status: 500 }
    );
  }
}
