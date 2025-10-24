import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.coordinator) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const teachers = await prisma.teacherProfile.findMany({
      include: { user: { select: { id: true, fullName: true } } },
    });

    const examiners = teachers.map((t) => ({
      id: t.userId,
      name: t.user.fullName,
      role: 'teacher' as const,
    }));

    return NextResponse.json({
      success: true,
      message: 'Daftar penguji berhasil diambil',
      data: examiners,
    });
  } catch (error) {
    console.error('Gagal mengambil daftar penguji:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil daftar penguji' },
      { status: 500 }
    );
  }
}
