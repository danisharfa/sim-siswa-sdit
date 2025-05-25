import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.coordinator) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
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
        handledByCoordinator: {
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
            group: {
              select: {
                name: true,
                classroom: {
                  select: { name: true, academicYear: true, semester: true },
                },
              },
            },
          },
        },
        teacher: {
          select: {
            user: { select: { fullName: true } },
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
      message: 'Berhasil mengambil permintaan ujian',
      data: tashih,
    });
  } catch (error) {
    console.error('[COORDINATOR_EXAM_REQUEST_GET]', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat mengambil data permintaan ujian' },
      { status: 500 }
    );
  }
}
