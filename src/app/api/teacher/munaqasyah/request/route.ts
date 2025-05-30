import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role, MunaqasyahStage, MunaqasyahRequestStatus } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.teacher) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!teacher) {
      return NextResponse.json({ success: false, error: 'Guru tidak ditemukan' }, { status: 404 });
    }

    const body = await req.json();
    const { studentId, juzId, stage } = body;

    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        classroom: true,
        group: true,
      },
    });

    if (!student || !student.classroom || !student.group) {
      return NextResponse.json(
        { success: false, message: 'Siswa belum memiliki kelas atau kelompok' },
        { status: 400 }
      );
    }

    if (!studentId || !juzId || !stage) {
      return NextResponse.json({ success: false, message: 'Data tidak lengkap' }, { status: 400 });
    }

    if (stage !== MunaqasyahStage.TAHAP_1) {
      return NextResponse.json(
        {
          success: false,
          message: 'Hanya tahap pertama (TAHAP_1) yang dapat didaftarkan oleh guru.',
        },
        { status: 400 }
      );
    }

    const setting = await prisma.academicSetting.findFirst();
    if (!setting) {
      return NextResponse.json(
        { success: false, message: 'Pengaturan akademik belum disetel' },
        { status: 400 }
      );
    }

    // Cek apakah sudah ada request serupa
    const existing = await prisma.munaqasyahRequest.findFirst({
      where: {
        studentId,
        juzId,
        stage,
        academicYear: setting.currentYear,
        semester: setting.currentSemester,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: 'Siswa sudah terdaftar pada tahap dan juz tersebut',
        },
        { status: 400 }
      );
    }

    // Simpan permintaan baru
    const request = await prisma.munaqasyahRequest.create({
      data: {
        studentId,
        teacherId: teacher.id,
        academicYear: setting.currentYear,
        semester: setting.currentSemester,
        juzId,
        stage,
        status: MunaqasyahRequestStatus.MENUNGGU,
        classroomId: student.classroom.id,
        classroomName: student.classroom.name,
        groupId: student.group.id,
        groupName: student.group.name,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Permintaan berhasil dikirim',
      data: request,
    });
  } catch (error) {
    console.error('[MUNAQASYAH_REQUEST_POST]', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan saat mengirim permintaan',
      },
      { status: 500 }
    );
  }
}
