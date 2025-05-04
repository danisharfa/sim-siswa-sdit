import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'coordinator') {
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

    const examRequests = await prisma.examRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
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
        surah: {
          select: { id: true, name: true },
        },
        juz: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Berhasil mengambil permintaan ujian',
      data: examRequests,
    });
  } catch (error) {
    console.error('[COORDINATOR_EXAM_REQUEST_GET]', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat mengambil data permintaan ujian' },
      { status: 500 }
    );
  }
}
