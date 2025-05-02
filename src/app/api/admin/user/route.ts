import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { username: 'asc' },
    });

    return NextResponse.json({
      success: true,
      message: 'Berhasil mengambil data user',
      data: users.map((user) => ({
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json({ message: 'Gagal mengambil data pengguna' }, { status: 500 });
  }
}
