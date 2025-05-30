import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role, MunaqasyahGrade, MunaqasyahRequestStatus, MunaqasyahStage } from '@prisma/client';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.teacher) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const results = await prisma.munaqasyahResult.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        request: {
          select: {
            stage: true,
            academicYear: true,
            semester: true,
            classroomName: true,
            groupName: true,
            juz: { select: { name: true } },
            student: {
              select: {
                nis: true,
                user: { select: { fullName: true } },
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
      academicYear: r.request.academicYear,
      semester: r.request.semester,
      classroomName: r.request.classroomName,
      groupName: r.request.groupName,
      stage: r.request.stage,
      juz: r.request.juz,
      student: r.request.student,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error('[GET_MUNAQASYAH_RESULT]', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengambil data hasil munaqasyah',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.teacher) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { scheduleId, requestId, score, note } = body;

    if (!scheduleId || !requestId || typeof score !== 'number') {
      return NextResponse.json({ success: false, message: 'Data tidak lengkap' }, { status: 400 });
    }

    const request = await prisma.munaqasyahRequest.findUnique({
      where: { id: requestId },
      include: {
        student: true,
        teacher: true,
        juz: true,
      },
    });

    if (!request) {
      return NextResponse.json(
        { success: false, message: 'Permintaan tidak ditemukan' },
        { status: 404 }
      );
    }

    let grade: MunaqasyahGrade = MunaqasyahGrade.TIDAK_LULUS;
    if (score >= 91) grade = MunaqasyahGrade.MUMTAZ;
    else if (score >= 85) grade = MunaqasyahGrade.JAYYID_JIDDAN;
    else if (score >= 80) grade = MunaqasyahGrade.JAYYID;

    const passed = score >= 80;

    // Simpan hasil munaqasyah
    await prisma.munaqasyahResult.create({
      data: {
        requestId,
        scheduleId,
        score,
        grade,
        passed,
        note,
      },
    });

    // Buat request tahap selanjutnya jika lulus
    if (passed && request.stage !== MunaqasyahStage.MUNAQASYAH) {
      const nextStageMap: Record<MunaqasyahStage, MunaqasyahStage> = {
        TAHAP_1: MunaqasyahStage.TAHAP_2,
        TAHAP_2: MunaqasyahStage.TAHAP_3,
        TAHAP_3: MunaqasyahStage.MUNAQASYAH,
        MUNAQASYAH: MunaqasyahStage.MUNAQASYAH,
      };

      const nextStage = nextStageMap[request.stage];

      const existing = await prisma.munaqasyahRequest.findFirst({
        where: {
          studentId: request.studentId,
          stage: nextStage,
          academicYear: request.academicYear,
          semester: request.semester,
        },
      });

      if (!existing) {
        await prisma.munaqasyahRequest.create({
          data: {
            studentId: request.studentId,
            teacherId: request.teacherId,
            academicYear: request.academicYear,
            semester: request.semester,
            classroomId: request.classroomId,
            classroomName: request.classroomName,
            groupId: request.groupId,
            groupName: request.groupName,
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
    });
  } catch (error) {
    console.error('[POST_TEACHER_MUNAQASYAH_RESULT]', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Gagal menyimpan hasil',
      },
      { status: 500 }
    );
  }
}
