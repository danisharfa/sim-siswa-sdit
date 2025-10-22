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

    const coordinator = await prisma.coordinatorProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!coordinator) {
      return NextResponse.json(
        { success: false, message: 'Profil koordinator tidak ditemukan' },
        { status: 404 }
      );
    }

    const data = await prisma.submission.findMany({
      orderBy: {
        date: 'desc',
      },
      include: {
        surah: { select: { id: true, name: true } },
        juz: { select: { id: true, name: true } },
        wafa: { select: { id: true, name: true } },
        student: {
          select: {
            nis: true,
            user: { select: { fullName: true } },
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            classroom: {
              select: { name: true, academicYear: true, semester: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Daftar Setoran berhasil diambil',
      data,
    });
  } catch (error) {
    console.error('Gagal mengambil daftar Setoran:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil daftar Setoran' },
      { status: 500 }
    );
  }
}
