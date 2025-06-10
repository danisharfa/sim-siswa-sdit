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
                juz: { select: { id: true, name: true } },
                student: {
                  select: {
                    id: true,
                    nis: true,
                    user: { select: { fullName: true } },
                  },
                },
                teacher: {
                  select: {
                    id: true,
                    user: { select: { fullName: true } },
                  },
                },
                group: {
                  select: {
                    id: true,
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
          },
        },
        results: {
          include: {
            tasmi: true,
            munaqasyah: true,
          },
        },
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { success: false, message: 'Jadwal tidak ditemukan atau Anda bukan pengujinya' },
        { status: 404 }
      );
    }

    // Map result by requestId for easier lookup
    const resultMap = new Map(schedule.results.map((res) => [res.requestId, res]));

    const results = schedule.scheduleRequests.map((sr) => {
      const r = sr.request;
      const studentResult = resultMap.get(r.id);

      return {
        requestId: r.id,
        scheduleId: schedule.id,
        batch: r.batch,
        stage: r.stage,
        academicYear: r.group.classroom.academicYear,
        semester: r.group.classroom.semester,
        classroomName: r.group.classroom.name,
        groupName: r.group.name,
        juz: r.juz,
        student: r.student,
        teacher: r.teacher,
        result: studentResult
          ? {
              id: studentResult.id,
              passed: studentResult.passed,
              avarageScore: studentResult.avarageScore,
              grade: studentResult.grade,
              tasmi: studentResult.tasmi,
              munaqasyah: studentResult.munaqasyah,
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