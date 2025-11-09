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
        { success: false, message: 'Koordinator tidak ditemukan' },
        { status: 404 }
      );
    }

    const tashih = await prisma.tashihRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        schedules: true,
        coordinator: {
          select: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
        student: {
          select: {
            nis: true,
            user: { select: { fullName: true } },
          },
        },
        teacher: {
          select: {
            user: { select: { fullName: true } },
          },
        },
        group: {
          select: {
            name: true,
            classroom: {
              select: {
                name: true,
                academicYear: true,
                semester: true,
              },
            },
          },
        },
        surah: {
          select: { name: true },
        },
        juz: {
          select: { name: true },
        },
        wafa: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Berhasil mengambil daftar permintaan tashih',
      data: tashih,
    });
  } catch (error) {
    console.error('Gagal mengambil daftar permintaan tashih:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil daftar permintaan tashih' },
      { status: 500 }
    );
  }
}
