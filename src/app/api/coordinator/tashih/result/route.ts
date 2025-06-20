import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.coordinator) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const results = await prisma.tashihResult.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        tashihRequest: {
          select: {
            tashihType: true,
            surah: { select: { name: true } },
            juz: { select: { name: true } },
            wafa: { select: { name: true } },
            startPage: true,
            endPage: true,
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
          },
        },
        tashihSchedule: {
          select: {
            date: true,
            sessionName: true,
            startTime: true,
            endTime: true,
            location: true,
          },
        },
        evaluatedByCoordinator: {
          select: {
            user: { select: { fullName: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('[GET_TASHIH_RESULTS]', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memuat hasil ujian' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.coordinator) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { scheduleId, requestId, passed, notes } = await req.json();
    if (!scheduleId || !requestId || typeof passed !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'Data hasil ujian tidak lengkap' },
        { status: 400 }
      );
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

    const existing = await prisma.tashihResult.findUnique({
      where: {
        scheduleId_requestId: {
          scheduleId,
          requestId,
        },
      },
    });

    const result = existing
      ? await prisma.tashihResult.update({
          where: {
            scheduleId_requestId: {
              scheduleId,
              requestId,
            },
          },
          data: {
            passed,
            notes: notes ?? null,
            evaluatedByCoordinatorId: coordinator.id,
          },
        })
      : await prisma.tashihResult.create({
          data: {
            scheduleId,
            requestId,
            passed,
            notes: notes ?? null,
            evaluatedByCoordinatorId: coordinator.id,
          },
        });

    await prisma.tashihRequest.update({
      where: { id: requestId },
      data: { status: 'SELESAI' },
    });

    return NextResponse.json({
      success: true,
      message: existing ? 'Hasil ujian diperbarui' : 'Hasil ujian disimpan',
      data: result,
    });
  } catch (error) {
    console.error('[POST_TASHIH_RESULT]', error);
    return NextResponse.json(
      { success: false, message: 'Gagal menyimpan hasil ujian' },
      { status: 500 }
    );
  }
}
