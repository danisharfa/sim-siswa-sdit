import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

type Params = Promise<{ id: string }>;

// Mengambil daftar siswa dalam suatu jadwal ujian dan hasil jika sudah ada.
export async function GET(req: NextRequest, segmentData: { params: Params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'coordinator') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const params = await segmentData.params;
    const scheduleId = params.id;

    if (!scheduleId) {
      return NextResponse.json(
        { success: false, message: 'scheduleId tidak ditemukan' },
        { status: 400 }
      );
    }

    const schedule = await prisma.tashihSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        schedules: {
          include: {
            tashihRequests: {
              select: {
                id: true,
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
                results: {
                  where: { tashihScheduleId: scheduleId },
                  select: {
                    id: true,
                    passed: true,
                    notes: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { success: false, message: 'Jadwal tidak ditemukan' },
        { status: 404 }
      );
    }

    const results = schedule.schedules.map((sr) => {
      const r = sr.tashihRequests;
      return {
        tashihScheduleId: schedule.id,
        tashihRequestId: r.id,
        tashihType: r.tashihType,
        student: r.student,
        surah: r.surah,
        juz: r.juz,
        wafa: r.wafa,
        startPage: r.startPage,
        endPage: r.endPage,
        result: r.results[0] || null,
      };
    });

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('[GET_EXAM_RESULT_BY_SCHEDULE]', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data hasil ujian' },
      { status: 500 }
    );
  }
}
