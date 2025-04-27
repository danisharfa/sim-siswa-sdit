import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const data = await prisma.wafa.findMany({
      select: {
        id: true,
        namaBuku: true,
      },
      orderBy: { id: 'asc' },
    });

    return NextResponse.json({
      success: true,
      message: 'Berhasil mengambil daftar Wafa',
      data,
    });
  } catch (error) {
    console.error('[Wafa_GET]', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil daftar Wafa' },
      { status: 500 }
    );
  }
}
