import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const data = await prisma.wafa.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { id: 'asc' },
    });

    return NextResponse.json({
      success: true,
      message: 'Daftar Wafa berhasil diambil',
      data,
    });
  } catch (error) {
    console.error('Gagal mengambil daftar Wafa:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil daftar Wafa' },
      { status: 500 }
    );
  }
}
