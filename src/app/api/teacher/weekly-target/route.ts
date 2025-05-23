import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { evaluateTargetAchievement } from '@/lib/data/teacher/evaluate-target';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'teacher') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!teacher) {
      return NextResponse.json(
        { success: false, message: 'Profil guru tidak ditemukan' },
        { status: 404 }
      );
    }

    const {
      studentId,
      academicYear,
      semester,
      type,
      description,
      startDate,
      endDate,
      surahStartId,
      surahEndId,
      startAyat,
      endAyat,
      wafaId,
      startPage,
      endPage,
    } = await req.json();

    if (!studentId || !academicYear || !semester || !type || !startDate || !endDate) {
      return NextResponse.json({ success: false, message: 'Data tidak lengkap' }, { status: 400 });
    }

    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      select: { groupId: true },
    });

    if (!student?.groupId) {
      return NextResponse.json(
        { success: false, message: 'Siswa belum tergabung dalam kelompok' },
        { status: 400 }
      );
    }

    const isMembimbing = await prisma.teacherGroup.findFirst({
      where: {
        teacherId: teacher.id,
        groupId: student.groupId,
      },
    });

    if (!isMembimbing) {
      return NextResponse.json(
        { success: false, message: 'Guru tidak membimbing siswa ini' },
        { status: 403 }
      );
    }

    const newTarget = await prisma.weeklyTarget.create({
      data: {
        studentId,
        teacherId: teacher.id,
        groupId: student.groupId,
        academicYear,
        semester,
        type,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        surahStartId,
        surahEndId,
        startAyat,
        endAyat,
        wafaId,
        startPage,
        endPage,
      },
    });

    await evaluateTargetAchievement(studentId, new Date(startDate), new Date(endDate));

    return NextResponse.json({ success: true, data: newTarget });
  } catch (error) {
    console.error('[WEEKLY_TARGET_POST]', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat menyimpan target' },
      { status: 500 }
    );
  }
}
