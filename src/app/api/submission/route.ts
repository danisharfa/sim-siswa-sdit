import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    const user = session?.user;

    if (!user || user.role !== 'teacher') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: user.id },
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

    const setoranList = await prisma.submission.findMany({
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
        surah: {
          select: {
            id: true,
            name: true,
          },
        },
        wafa: {
          select: {
            id: true,
            name: true,
          },
        },
        student: {
          select: {
            nis: true,
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
        group: {
          select: {
            name: true,
            classroom: {
              select: {
                name: true,
                academicYear: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Data setoran berhasil diambil',
      data: setoranList,
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
    const user = session?.user;

    if (!user || user.role !== 'teacher') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const {
      groupId,
      studentId,
      submissionType,
      submissionStatus,
      adab,
      note,
      juz,
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
      where: { userId: user.id },
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

    const siswa = await prisma.studentProfile.findFirst({
      where: {
        id: studentId,
        groupId,
      },
    });

    if (!siswa) {
      return NextResponse.json(
        { success: false, message: 'Siswa tidak berada di kelompok ini' },
        { status: 400 }
      );
    }

    const setoranId = `SETORAN-${crypto.randomUUID()}`;

    const setoran = await prisma.submission.create({
      data: {
        id: setoranId,
        studentId,
        teacherId: teacher.id,
        groupId,
        date: new Date(),
        submissionType,
        submissionStatus,
        adab,
        note,
        juz,
        surahId,
        startVerse,
        endVerse,
        wafaId,
        startPage,
        endPage,
      },
    });

    return NextResponse.json({ success: true, data: setoran });
  } catch (error) {
    console.error('[SUBMISSION_POST]', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat menyimpan setoran' },
      { status: 500 }
    );
  }
}
