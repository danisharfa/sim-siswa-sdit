import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { MunaqasyahGrade, MunaqasyahStage, MunaqasyahRequestStatus, Role } from '@prisma/client';

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
      },
    });

    const formatted = results.map((r) => ({
      id: r.id,
      score: r.score,
      grade: r.grade,
      passed: r.passed,
      note: r.note,
      schedule: r.schedule,
      academicYear: r.request.group.classroom.academicYear,
      semester: r.request.group.classroom.semester,
      classroomName: r.request.group.classroom.name,
      groupName: r.request.group.name,
      stage: r.request.stage,
      juz: r.request.juz,
      student: r.request.student,
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
    const { scheduleId, requestId, score, note } = body;

    if (!scheduleId || !requestId || typeof score !== 'number') {
      return NextResponse.json({ success: false, message: 'Data tidak lengkap' }, { status: 400 });
    }

    // Validate score range
    if (score < 0 || score > 100) {
      return NextResponse.json(
        { success: false, message: 'Skor harus antara 0-100' },
        { status: 400 }
      );
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

    // Determine grade based on score
    let grade: MunaqasyahGrade = MunaqasyahGrade.TIDAK_LULUS;
    if (score >= 91) grade = MunaqasyahGrade.MUMTAZ;
    else if (score >= 85) grade = MunaqasyahGrade.JAYYID_JIDDAN;
    else if (score >= 80) grade = MunaqasyahGrade.JAYYID;

    const passed = score >= 80;

    // Save munaqasyah result
    const result = await prisma.munaqasyahResult.create({
      data: {
        requestId,
        scheduleId,
        score,
        grade,
        passed,
        note: note || null,
      },
    });

    // Create next stage request if passed and not final stage
    if (passed && request.stage !== MunaqasyahStage.MUNAQASYAH) {
      const nextStageMap: Record<MunaqasyahStage, MunaqasyahStage> = {
        TAHAP_1: MunaqasyahStage.TAHAP_2,
        TAHAP_2: MunaqasyahStage.TAHAP_3,
        TAHAP_3: MunaqasyahStage.MUNAQASYAH,
        MUNAQASYAH: MunaqasyahStage.MUNAQASYAH, // This won't be reached
      };

      const nextStage = nextStageMap[request.stage];

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
