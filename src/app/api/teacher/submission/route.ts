import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
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

    const kelompokBinaan = await prisma.teacherGroup.findMany({
      where: { teacherId: teacher.id },
      select: { groupId: true },
    });

    const groupIds = kelompokBinaan.map((item) => item.groupId);

    const submissionList = await prisma.submission.findMany({
      where: {
        teacherId: teacher.id,
        groupId: {
          in: groupIds,
        },
      },
      orderBy: {
        date: 'desc',
      },
      include: {
        surah: { select: { id: true, name: true } },
        juz: { select: { id: true, name: true } },
        wafa: { select: { id: true, name: true } },
        student: {
          select: {
            nis: true,
            user: { select: { fullName: true } },
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            classroom: {
              select: { name: true, academicYear: true, semester: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Data setoran berhasil diambil',
      data: submissionList,
    });
  } catch (error) {
    console.error('[SUBMISSION_GET]', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan saat mengambil data setoran',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'teacher') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const {
      groupId,
      studentId,
      submissionType,
      submissionStatus,
      adab,
      note,
      juzId,
      surahId,
      startVerse,
      endVerse,
      wafaId,
      startPage,
      endPage,
    } = await req.json();

    if (!groupId || !studentId || !submissionType) {
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

    const isGuruMembimbing = await prisma.teacherGroup.findFirst({
      where: {
        teacherId: teacher.id,
        groupId,
      },
    });

    if (!isGuruMembimbing) {
      return NextResponse.json(
        { success: false, message: 'Guru tidak membimbing kelompok ini' },
        { status: 403 }
      );
    }

    const student = await prisma.studentProfile.findFirst({
      where: {
        id: studentId,
        groupId,
      },
      include: {
        classroom: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Siswa tidak berada di kelompok ini' },
        { status: 400 }
      );
    }

    if (!student?.classroom) {
      return NextResponse.json(
        {
          success: false,
          message: 'Siswa belum terdaftar di kelas aktif',
        },
        { status: 400 }
      );
    }

    const submissionId = `SETORAN-${crypto.randomUUID()}`;

    const submission = await prisma.submission.create({
      data: {
        id: submissionId,
        studentId,
        teacherId: teacher.id,
        groupId,
        date: new Date(),
        academicYear: student.classroom?.academicYear ?? '',
        semester: student.classroom?.semester ?? 'GANJIL',
        submissionType,
        submissionStatus,
        adab,
        note,
        juzId,
        surahId,
        startVerse,
        endVerse,
        wafaId,
        startPage,
        endPage,
      },
    });

    return NextResponse.json({ success: true, data: submission });
  } catch (error) {
    console.error('[SUBMISSION_POST]', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat menyimpan setoran' },
      { status: 500 }
    );
  }
}
