import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      orderBy: { username: 'asc' },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },  
    });

    return NextResponse.json({
      success: true,
      message: 'Berhasil mengambil daftar pengguna',
      data: users,
    });
  } catch (error) {
    console.error('Gagal mengambil daftar pengguna:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil daftar pengguna' },
      { status: 500 }
    );
  }
}
