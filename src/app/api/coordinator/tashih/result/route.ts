import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'coordinator') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const results = await prisma.tashihResult.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        tashihRequests: {
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
                group: {
                  select: {
                    name: true,
                    classroom: {
                      select: {
                        name: true,
                        academicYear: true,
                      },
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
          },
        },
        tashihSchedules: {
          select: {
            date: true,
            sessionName: true,
            startTime: true,
            endTime: true,
            location: true,
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
    if (!session || session.user.role !== 'coordinator') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { tashihScheduleId, tashihRequestId, passed, notes } = await req.json();

    if (!tashihScheduleId || !tashihRequestId || typeof passed !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'Data hasil ujian tidak lengkap' },
        { status: 400 }
      );
    }

    const existing = await prisma.tashihResult.findUnique({
      where: {
        tashihScheduleId_tashihRequestId: {
          tashihScheduleId,
          tashihRequestId,
        },
      },
    });

    const result = existing
      ? await prisma.tashihResult.update({
          where: {
            tashihScheduleId_tashihRequestId: {
              tashihScheduleId,
              tashihRequestId,
            },
          },
          data: {
            passed,
            notes: notes ?? null,
          },
        })
      : await prisma.tashihResult.create({
          data: {
            tashihScheduleId,
            tashihRequestId,
            passed,
            notes: notes ?? null,
          },
        });

    await prisma.tashihRequest.update({
      where: { id: tashihRequestId },
      data: { status: 'SELESAI' },
    });

    return NextResponse.json({
      success: true,
      message: existing ? 'Hasil ujian diperbarui' : 'Hasil ujian disimpan',
      data: result,
    });
  } catch (error) {
    console.error('[POST_EXAM_RESULT]', error);
    return NextResponse.json(
      { success: false, message: 'Gagal menyimpan hasil ujian' },
      { status: 500 }
    );
  }
}
