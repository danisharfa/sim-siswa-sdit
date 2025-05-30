import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role, TashihRequestStatus, TashihType } from '@prisma/client';

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
      return NextResponse.json(
        { success: false, message: 'Guru tidak ditemukan' },
        { status: 404 }
      );
    }

    const { studentId, tashihType, juzId, surahId, wafaId, startPage, endPage, notes } =
      await req.json();

    if (!studentId || !tashihType) {
      return NextResponse.json({ success: false, message: 'Data tidak lengkap' }, { status: 400 });
    }

    if (tashihType === TashihType.ALQURAN) {
      if (!juzId || !surahId) {
        return NextResponse.json(
          { success: false, message: 'Juz dan Surah wajib diisi' },
          { status: 400 }
        );
      }
    } else if (tashihType === TashihType.WAFA) {
      if (!wafaId || startPage == null) {
        return NextResponse.json(
          { success: false, message: 'Wafa dan halaman mulai wajib diisi' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, message: 'Jenis tashih tidak valid' },
        { status: 400 }
      );
    }

    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      select: {
        group: {
          select: {
            id: true,
            name: true,
            classroom: {
              select: {
                id: true,
                name: true,
                academicYear: true,
                semester: true,
              },
            },
          },
        },
      },
    });

    if (!student || !student.group || !student.group.classroom) {
      return NextResponse.json(
        {
          success: false,
          message: 'Siswa belum terdaftar dalam kelompok atau kelas',
        },
        { status: 400 }
      );
    }

    const classroom = student.group.classroom;
    const group = student.group;

    const existing = await prisma.tashihRequest.findFirst({
      where: {
        studentId,
        tashihType,
        status: TashihRequestStatus.MENUNGGU,
        ...(tashihType === TashihType.ALQURAN && { juzId, surahId }),
        ...(tashihType === TashihType.WAFA && {
          wafaId,
          startPage,
          endPage: endPage ?? startPage,
        }),
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: 'Permintaan tashih sudah ada dan masih menunggu.',
        },
        { status: 400 }
      );
    }

    const newRequest = await prisma.tashihRequest.create({
      data: {
        teacherId: teacher.id,
        studentId,
        academicYear: classroom.academicYear,
        semester: classroom.semester,
        classroomId: classroom.id,
        classroomName: classroom.name,
        groupId: group.id,
        groupName: group.name,
        tashihType,
        juzId: tashihType === TashihType.ALQURAN ? juzId : null,
        surahId: tashihType === TashihType.ALQURAN ? surahId : null,
        wafaId: tashihType === TashihType.WAFA ? wafaId : null,
        startPage: tashihType === TashihType.WAFA ? startPage : null,
        endPage: tashihType === TashihType.WAFA ? endPage ?? startPage : null,
        status: TashihRequestStatus.MENUNGGU,
        notes: notes ?? null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Berhasil mendaftarkan permintaan tashih',
      data: newRequest,
    });
  } catch (error) {
    console.error('[TASHIH_REQUEST_POST]', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mendaftarkan permintaan tashih' },
      { status: 500 }
    );
  }
}
