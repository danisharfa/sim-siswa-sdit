import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role, MunaqosyahGrade, MunaqosyahRequestStatus, MunaqosyahStage } from '@prisma/client';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.teacher) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const results = await prisma.munaqosyahResult.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        juz: true,
        schedule: {
          select: {
            date: true,
            sessionName: true,
            startTime: true,
            endTime: true,
            location: true,
          },
        },
        student: {
          select: {
            nis: true,
            user: { select: { fullName: true } },
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
      },
    });

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('[GET_MUNAQOSYAH_RESULT]', error);
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

    const request = await prisma.munaqosyahRequest.findUnique({
      where: { id: requestId },
      include: {
        student: true,
        teacher: true,
        juz: true,
      },
    });

    if (!request) {
      return NextResponse.json(
        {
          success: false,
          message: 'Permintaan tidak ditemukan',
        },
        { status: 404 }
      );
    }

    // Hitung grade
    let grade: MunaqosyahGrade = MunaqosyahGrade.TIDAK_LULUS;
    if (score >= 91) grade = MunaqosyahGrade.MUMTAZ;
    else if (score >= 85) grade = MunaqosyahGrade.JAYYID_JIDDAN;
    else if (score >= 80) grade = MunaqosyahGrade.JAYYID;

    const passed = score >= 80;

    // Simpan hasil munaqasyah
    await prisma.munaqosyahResult.create({
      data: {
        studentId: request.studentId,
        scheduleId,
        stage: request.stage,
        academicYear: request.academicYear,
        semester: request.semester,
        juzId: request.juzId,
        score,
        grade,
        passed,
        note,
      },
    });

    // Jika lulus, buat permintaan ke tahap berikutnya (termasuk MUNAQASYAH)
    if (passed && request.stage !== MunaqosyahStage.MUNAQASYAH) {
      const nextStageMap: Record<MunaqosyahStage, MunaqosyahStage> = {
        TAHAP_1: MunaqosyahStage.TAHAP_2,
        TAHAP_2: MunaqosyahStage.TAHAP_3,
        TAHAP_3: MunaqosyahStage.MUNAQASYAH,
        MUNAQASYAH: MunaqosyahStage.MUNAQASYAH,
      };

      const nextStage = nextStageMap[request.stage];

      const existing = await prisma.munaqosyahRequest.findFirst({
        where: {
          studentId: request.studentId,
          stage: nextStage,
          academicYear: request.academicYear,
          semester: request.semester,
        },
      });

      if (!existing) {
        await prisma.munaqosyahRequest.create({
          data: {
            studentId: request.studentId,
            teacherId: request.teacherId,
            academicYear: request.academicYear,
            semester: request.semester,
            juzId: request.juzId,
            stage: nextStage,
            status: MunaqosyahRequestStatus.MENUNGGU,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Hasil munaqasyah berhasil disimpan',
    });
  } catch (error) {
    console.error('[POST_TEACHER_MUNAQOSYAH_RESULT]', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Gagal menyimpan hasil',
      },
      { status: 500 }
    );
  }
}
