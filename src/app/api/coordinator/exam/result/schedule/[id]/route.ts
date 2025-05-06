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

    const schedule = await prisma.examSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        schedules: {
          include: {
            examRequest: {
              select: {
                id: true,
                examType: true,
                surah: { select: { name: true } },
                juz: { select: { name: true } },
                student: {
                  select: {
                    nis: true,
                    user: { select: { fullName: true } },
                  },
                },
                result: {
                  where: { examScheduleId: scheduleId },
                  select: {
                    id: true,
                    score: true,
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
      const r = sr.examRequest;
      return {
        examScheduleId: schedule.id,
        examRequestId: r.id,
        student: r.student,
        examType: r.examType,
        surah: r.surah,
        juz: r.juz,
        result: r.result[0] || null,
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
