import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role, MunaqasyahGrade, MunaqasyahRequestStatus, MunaqasyahStage } from '@prisma/client';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.coordinator) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const results = await prisma.munaqasyahResult.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        request: {
          select: {
            batch: true,
            stage: true,
            juz: { select: { name: true } },
            student: {
              select: {
                nis: true,
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
        schedule: {
          select: {
            date: true,
            sessionName: true,
            startTime: true,
            endTime: true,
            location: true,
          },
        },
        tasmi: {
          select: {
            tajwid: true,
            kelancaran: true,
            adab: true,
            note: true,
            totalScore: true,
          },
        },
        munaqasyah: {
          select: {
            tajwid: true,
            kelancaran: true,
            adab: true,
            note: true,
            totalScore: true,
          },
        },
      },
    });

    const formatted = results.map((r) => ({
      id: r.id,
      score: r.avarageScore || 0,
      grade: r.grade,
      passed: r.passed,
      schedule: r.schedule,
      academicYear: r.request.group.classroom.academicYear,
      semester: r.request.group.classroom.semester,
      classroomName: r.request.group.classroom.name,
      groupName: r.request.group.name,
      batch: r.request.batch,
      stage: r.request.stage,
      juz: r.request.juz,
      student: r.request.student,
      scoreDetails: {
        tasmi: r.tasmi,
        munaqasyah: r.munaqasyah,
      },
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error('[GET_MUNAQASYAH_RESULT]', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data hasil munaqasyah' },
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

    const body = await req.json();
    const { scheduleId, requestId, stage, tasmi, munaqasyah } = body;

    if (!scheduleId || !requestId || !stage) {
      return NextResponse.json({ success: false, message: 'Data tidak lengkap' }, { status: 400 });
    }

    const request = await prisma.munaqasyahRequest.findUnique({
      where: { id: requestId },
      include: {
        student: {
          select: {
            id: true,
            group: {
              select: {
                id: true,
                classroom: {
                  select: {
                    academicYear: true,
                    semester: true,
                  },
                },
              },
            },
          },
        },
        teacher: { select: { id: true } },
        juz: { select: { id: true } },
      },
    });

    if (!request) {
      return NextResponse.json(
        { success: false, message: 'Permintaan tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check if result already exists
    const existingResult = await prisma.munaqasyahResult.findFirst({
      where: {
        requestId,
        scheduleId,
      },
    });

    if (existingResult) {
      return NextResponse.json(
        { success: false, message: 'Hasil munaqasyah sudah ada untuk permintaan ini' },
        { status: 400 }
      );
    }

    // Get existing result for this student and juz to check for previous stages
    const existingStudentResult = await prisma.munaqasyahResult.findFirst({
      where: {
        request: {
          studentId: request.studentId,
          juzId: request.juzId,
        },
      },
      include: {
        tasmi: true,
        munaqasyah: true,
      },
    });

    let tasmiScoreId: string | undefined;
    let munaqasyahScoreId: string | undefined;
    let tasmiAverage = 0;
    let munaqasyahAverage = 0;

    // Handle existing scores from previous stages
    if (existingStudentResult?.tasmi) {
      tasmiAverage = existingStudentResult.tasmi.totalScore || 0;
      tasmiScoreId = existingStudentResult.tasmi.id;
    }
    if (existingStudentResult?.munaqasyah) {
      munaqasyahAverage = existingStudentResult.munaqasyah.totalScore || 0;
      munaqasyahScoreId = existingStudentResult.munaqasyah.id;
    }

    // Create score records based on current stage
    if (stage === MunaqasyahStage.TASMI && tasmi) {
      // Validate tasmi scores
      if (tasmi.tajwid < 0 || tasmi.tajwid > 100 || 
          tasmi.kelancaran < 0 || tasmi.kelancaran > 100 || 
          tasmi.adab < 0 || tasmi.adab > 100) {
        return NextResponse.json(
          { success: false, message: 'Nilai harus antara 0-100' },
          { status: 400 }
        );
      }

      const total = tasmi.tajwid + tasmi.kelancaran + tasmi.adab;
      tasmiAverage = total / 3;

      const tasmiScore = await prisma.tasmiScore.create({
        data: {
          tajwid: tasmi.tajwid,
          kelancaran: tasmi.kelancaran,
          adab: tasmi.adab,
          note: tasmi.note || null,
          totalScore: tasmiAverage,
        },
      });

      tasmiScoreId = tasmiScore.id;
    } else if (stage === MunaqasyahStage.MUNAQASYAH && munaqasyah) {
      // Validate munaqasyah scores
      if (munaqasyah.tajwid < 0 || munaqasyah.tajwid > 100 || 
          munaqasyah.kelancaran < 0 || munaqasyah.kelancaran > 100 || 
          tasmi.adab < 0 || tasmi.adab > 100) {
        return NextResponse.json(
          { success: false, message: 'Nilai harus antara 0-100' },
          { status: 400 }
        );
      }

      const total = munaqasyah.tajwid + munaqasyah.kelancaran;
      munaqasyahAverage = total / 2;

      const munaqasyahScore = await prisma.munaqasyahScore.create({
        data: {
          tajwid: munaqasyah.tajwid,
          kelancaran: munaqasyah.kelancaran,
          adab: munaqasyah.adab,
          note: munaqasyah.note || null,
          totalScore: munaqasyahAverage,
        },
      });

      munaqasyahScoreId = munaqasyahScore.id;
    } else {
      return NextResponse.json(
        { success: false, message: 'Data nilai tidak valid untuk stage yang dipilih' },
        { status: 400 }
      );
    }

    // Calculate weighted average: TASMI 60%, MUNAQASYAH 40%
    let averageScore = 0;
    if (tasmiAverage > 0 && munaqasyahAverage > 0) {
      // Both stages completed
      averageScore = (tasmiAverage * 0.6) + (munaqasyahAverage * 0.4);
    } else if (tasmiAverage > 0) {
      // Only TASMI completed
      averageScore = tasmiAverage;
    } else if (munaqasyahAverage > 0) {
      // Only MUNAQASYAH completed (shouldn't happen normally)
      averageScore = munaqasyahAverage;
    }

    // Determine grade based on average score
    let grade: MunaqasyahGrade = MunaqasyahGrade.TIDAK_LULUS;
    if (averageScore >= 91) grade = MunaqasyahGrade.MUMTAZ;
    else if (averageScore >= 85) grade = MunaqasyahGrade.JAYYID_JIDDAN;
    else if (averageScore >= 80) grade = MunaqasyahGrade.JAYYID;

    const passed = averageScore >= 80;

    // Save munaqasyah result
    const result = await prisma.munaqasyahResult.create({
      data: {
        requestId,
        scheduleId,
        tasmiScoreId,
        munaqasyahScoreId,
        avarageScore: averageScore,
        grade,
        passed,
      },
    });

    // Create next stage request if passed and not final stage
    if (passed && request.stage !== MunaqasyahStage.MUNAQASYAH) {
      const nextStage = MunaqasyahStage.MUNAQASYAH;

      // Check if next stage request already exists
      const existingNextRequest = await prisma.munaqasyahRequest.findFirst({
        where: {
          studentId: request.studentId,
          juzId: request.juzId,
          stage: nextStage,
        },
      });

      if (!existingNextRequest) {
        await prisma.munaqasyahRequest.create({
          data: {
            studentId: request.studentId,
            teacherId: request.teacherId,
            groupId: request.groupId,
            juzId: request.juzId,
            batch: request.batch,
            stage: nextStage,
            status: MunaqasyahRequestStatus.MENUNGGU,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Hasil munaqasyah berhasil disimpan',
      data: result,
    });
  } catch (error) {
    console.error('[POST_MUNAQASYAH_RESULT]', error);
    return NextResponse.json(
      { success: false, message: 'Gagal menyimpan hasil munaqasyah' },
      { status: 500 }
    );
  }
}