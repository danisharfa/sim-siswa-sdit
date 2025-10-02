import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

type Params = Promise<{ id: string }>;

export async function GET(req: NextRequest, segmentData: { params: Params }) {
  try {
    const params = await segmentData.params;
    const scheduleId = params.id;

    const session = await auth();
    if (
      !session ||
      (session.user.role !== Role.teacher && session.user.role !== Role.coordinator)
    ) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    if (!scheduleId) {
      return NextResponse.json({ success: false, message: 'ID tidak ditemukan' }, { status: 400 });
    }

    const schedule = await prisma.munaqasyahSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        scheduleRequests: {
          include: {
            request: {
              include: {
                juz: { select: { id: true, name: true } },
                student: {
                  select: {
                    userId: true,
                    nis: true,
                    user: { select: { fullName: true } },
                  },
                },
                teacher: {
                  select: {
                    userId: true,
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
            tasmiScores: {
              select: {
                note: true,
                totalScore: true,
              },
            },
            munaqasyahScores: {
              select: {
                note: true,
                totalScore: true,
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

    // Map result by requestId for easier lookup
    const resultMap = new Map(schedule.results.map((res) => [res.requestId, res]));

    const results = schedule.scheduleRequests.map((sr) => {
      const r = sr.request;
      const studentResult = resultMap.get(r.id);

      // Determine if this stage has been completed
      let hasResult = false;
      if (studentResult) {
        if (r.stage === 'TASMI' && studentResult.tasmiScores) {
          hasResult = true;
        } else if (r.stage === 'MUNAQASYAH' && studentResult.munaqasyahScores) {
          hasResult = true;
        }
        // Also hide students who have completed MUNAQASYAH stage completely
        // (they shouldn't appear in any further assessment forms)
        if (studentResult.munaqasyahScores) {
          hasResult = true;
        }
      }

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
        result:
          hasResult && studentResult
            ? {
                id: studentResult.id,
                passed: studentResult.passed,
                grade: studentResult.grade,
                tasmiScores: studentResult.tasmiScores,
                munaqasyahScores: studentResult.munaqasyahScores,
              }
            : null,
      };
    });

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('[GET_MUNAQASYAH_RESULT_BY_SCHEDULE]', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data hasil munaqasyah' },
      { status: 500 }
    );
  }
}
