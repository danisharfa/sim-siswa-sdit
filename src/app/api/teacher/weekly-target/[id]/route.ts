import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { evaluateTargetAchievement } from '@/lib/data/teacher/evaluate-target';
import { Role } from '@prisma/client';

type Params = Promise<{ id: string }>;

export async function PUT(req: NextRequest, segment: { params: Params }) {
  try {
    const params = await segment.params;
    const id = params.id;

    const session = await auth();
    if (!session || session.user.role !== Role.teacher) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
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

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, message: 'Profil guru tidak ditemukan' },
        { status: 404 }
      );
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

    const updated = await prisma.weeklyTarget.update({
      where: { id },
      data: {
        studentId,
        teacherId: teacher.id,
        groupId: student.groupId,
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

    await evaluateTargetAchievement(updated.studentId, updated.startDate, updated.endDate);

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[WEEKLY_TARGET_PUT]', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat update target' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, segment: { params: Params }) {
  try {
    const params = await segment.params;
    const id = params.id;

    const session = await auth();
    if (!session || session.user.role !== Role.teacher) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const target = await prisma.weeklyTarget.findUnique({
      where: { id },
      select: { teacherId: true },
    });

    if (!target) {
      return NextResponse.json(
        { success: false, message: 'Target tidak ditemukan' },
        { status: 404 }
      );
    }

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher || target.teacherId !== teacher.id) {
      return NextResponse.json(
        { success: false, message: 'Tidak diizinkan menghapus target ini' },
        { status: 403 }
      );
    }

    await prisma.weeklyTarget.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Target berhasil dihapus' });
  } catch (error) {
    console.error('[WEEKLY_TARGET_DELETE]', error);
    return NextResponse.json(
      { success: false, message: 'Gagal menghapus target' },
      { status: 500 }
    );
  }
}
