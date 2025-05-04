import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

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
      return NextResponse.json({ success: false, error: 'Guru tidak ditemukan' }, { status: 404 });
    }

    const { studentId, examType, surahId, juzId, notes } = await req.json();

    if (!studentId || !examType) {
      return NextResponse.json({ success: false, message: 'Data tidak lengkap' }, { status: 400 });
    }

    const existing = await prisma.examRequest.findFirst({
      where: {
        studentId,
        examType,
        surahId: examType === 'SURAH' ? surahId : undefined,
        juzId: examType === 'JUZ' ? juzId : undefined,
        status: 'MENUNGGU',
      },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Ujian sudah terdaftar dan menunggu.' },
        { status: 400 }
      );
    }

    const exam = await prisma.examRequest.create({
      data: {
        studentId,
        teacherId: teacher.id,
        examType,
        surahId: examType === 'SURAH' ? surahId : null,
        juzId: examType === 'JUZ' ? juzId : null,
        notes: notes ?? null,
        status: 'MENUNGGU',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Berhasil mendaftarkan ujian',
      data: exam,
    });
  } catch (error) {
    console.error('[EXAM_REGISTER_POST]', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mendaftarkan ujian' },
      { status: 500 }
    );
  }
}
