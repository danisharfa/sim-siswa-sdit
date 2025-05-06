import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'coordinator') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const results = await prisma.examResult.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        examRequest: {
          select: {
            examType: true,
            surah: { select: { name: true } },
            juz: { select: { name: true } },
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
          },
        },
        examSchedule: {
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
    console.error('[GET_EXAM_RESULTS]', error);
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

    const { examScheduleId, examRequestId, score, passed, notes } = await req.json();

    if (!examScheduleId || !examRequestId || typeof score !== 'number' || passed === undefined) {
      return NextResponse.json(
        { success: false, message: 'Data hasil ujian tidak lengkap' },
        { status: 400 }
      );
    }

    const existing = await prisma.examResult.findUnique({
      where: {
        examScheduleId_examRequestId: {
          examScheduleId,
          examRequestId,
        },
      },
    });

    const result = existing
      ? await prisma.examResult.update({
          where: {
            examScheduleId_examRequestId: {
              examScheduleId,
              examRequestId,
            },
          },
          data: {
            score,
            passed,
            notes,
          },
        })
      : await prisma.examResult.create({
          data: {
            examScheduleId,
            examRequestId,
            score,
            passed,
            notes,
          },
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
