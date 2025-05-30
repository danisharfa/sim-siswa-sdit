import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

type Params = Promise<{ id: string }>;

export async function GET(req: NextRequest, segmentData: { params: Params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.teacher) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const params = await segmentData.params;
    const scheduleId = params.id;

    if (!scheduleId) {
      return NextResponse.json({ success: false, message: 'ID tidak ditemukan' }, { status: 400 });
    }

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, message: 'Guru tidak ditemukan' },
        { status: 404 }
      );
    }

    const schedule = await prisma.munaqasyahSchedule.findFirst({
      where: {
        id: scheduleId,
        examinerId: teacher.id,
      },
      include: {
        scheduleRequests: {
          include: {
            request: {
              include: {
                juz: { select: { name: true } },
                student: {
                  select: {
                    id: true,
                    nis: true,
                    user: { select: { fullName: true } },
                  },
                },
              },
            },
          },
        },
        results: true,
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { success: false, message: 'Jadwal tidak ditemukan atau Anda bukan pengujinya' },
        { status: 404 }
      );
    }

    // Gunakan requestId sebagai key
    const resultMap = new Map(schedule.results.map((res) => [res.requestId, res]));

    const results = schedule.scheduleRequests.map((sr) => {
      const r = sr.request;
      const studentResult = resultMap.get(r.id);

      return {
        requestId: r.id,
        scheduleId: schedule.id,
        stage: r.stage,
        juz: r.juz,
        student: r.student,
        result: studentResult
          ? {
              id: studentResult.id,
              passed: studentResult.passed,
              score: studentResult.score,
              grade: studentResult.grade,
              note: studentResult.note,
            }
          : null,
      };
    });

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('[TEACHER_GET_MUNAQASYAH_RESULT_BY_SCHEDULE]', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data hasil munaqasyah' },
      { status: 500 }
    );
  }
}
