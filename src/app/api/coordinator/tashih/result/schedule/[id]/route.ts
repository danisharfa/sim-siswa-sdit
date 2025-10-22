import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role } from '@prisma/client';

type Params = Promise<{ id: string }>;

// Mengambil daftar siswa dalam suatu jadwal tashih dan hasilnya jika sudah dinilai.
export async function GET(req: NextRequest, segmentData: { params: Params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.coordinator) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
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
            tashihRequest: {
              select: {
                id: true,
                tashihType: true,
                startPage: true,
                endPage: true,
                surah: { select: { name: true } },
                juz: { select: { name: true } },
                wafa: { select: { name: true } },
                student: {
                  select: {
                    nis: true,
                    user: { select: { fullName: true } },
                  },
                },
                result: {
                  select: {
                    id: true,
                    passed: true,
                    scheduleId: true,
                    coordinator: {
                      select: {
                        user: { select: { fullName: true } },
                      },
                    },
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
      const r = sr.tashihRequest;
      const res = r.result && r.result.scheduleId === schedule.id ? r.result : null;

      return {
        scheduleId: schedule.id,
        requestId: r.id,
        tashihType: r.tashihType,
        student: r.student,
        surah: r.surah,
        juz: r.juz,
        wafa: r.wafa,
        startPage: r.startPage,
        endPage: r.endPage,
        result: res
          ? {
              id: res.id,
              passed: res.passed,
              evaluatedBy: res.coordinator?.user.fullName ?? null,
            }
          : null,
      };
    });

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('[GET_TASHIH_RESULT_BY_SCHEDULE]', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data hasil tashih' },
      { status: 500 }
    );
  }
}
