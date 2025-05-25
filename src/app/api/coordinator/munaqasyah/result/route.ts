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

    // Hitung grade
    let grade: MunaqasyahGrade = MunaqasyahGrade.TIDAK_LULUS;
    if (score >= 91) grade = MunaqasyahGrade.MUMTAZ;
    else if (score >= 85) grade = MunaqasyahGrade.JAYYID_JIDDAN;
    else if (score >= 80) grade = MunaqasyahGrade.JAYYID;

    const passed = score >= 80;

    // Simpan hasil munaqasyah
    await prisma.munaqasyahResult.create({
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

    // Jika lulus dan belum MUNAQASYAH, otomatis buat request tahap selanjutnya
    if (passed && request.stage !== MunaqasyahStage.MUNAQASYAH) {
      const nextStageMap: Record<MunaqasyahStage, MunaqasyahStage> = {
        TAHAP_1: MunaqasyahStage.TAHAP_2,
        TAHAP_2: MunaqasyahStage.TAHAP_3,
        TAHAP_3: MunaqasyahStage.MUNAQASYAH,
        MUNAQASYAH: MunaqasyahStage.MUNAQASYAH, // fallback
      };

      const nextStage = nextStageMap[request.stage];

      // Cek apakah request untuk tahap berikutnya sudah ada
      const existing = await prisma.munaqasyahRequest.findFirst({
        where: {
          studentId: request.studentId,
          stage: nextStage,
          academicYear: request.academicYear,
          semester: request.semester,
        },
      });

      if (!existing && nextStage !== 'MUNAQASYAH') {
        await prisma.munaqasyahRequest.create({
          data: {
            studentId: request.studentId,
            teacherId: request.teacherId,
            academicYear: request.academicYear,
            semester: request.semester,
            juzId: request.juzId,
            stage: nextStage,
            status: MunaqasyahRequestStatus.MENUNGGU,
          },
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Hasil munaqasyah berhasil disimpan' });
  } catch (error) {
    console.error('[POST_MUNAQASYAH_RESULT]', error);
    return NextResponse.json(
      { success: false, message: 'Gagal menyimpan hasil munaqasyah' },
      { status: 500 }
    );
  }
}
