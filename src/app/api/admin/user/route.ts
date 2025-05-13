import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      orderBy: { username: 'asc' },
    });

    const mapData = users.map((user) => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      message: 'Berhasil mengambil daftar pengguna',
      data: mapData,
    });
  } catch (error) {
    console.error('Gagal mengambil daftar pengguna:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil daftar pengguna' },
      { status: 500 }
    );
  }
}
