import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

type Params = Promise<{ studentId: string }>;

export async function GET(req: NextRequest, segmentData: { params: Params }) {
  try {
    const params = await segmentData.params;
    const studentId = params.studentId;

    const session = await auth();
    if (!session || session.user.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Guru tidak ditemukan' }, { status: 404 });
    }

    // Cek apakah guru membimbing siswa ini
    const group = await prisma.group.findFirst({
      where: {
        teacherGroups: {
          some: { teacherId: teacher.id },
        },
        students: {
          some: { id: studentId },
        },
      },
      include: {
        classroom: true,
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: 'Siswa tidak ditemukan dalam bimbingan guru ini' },
        { status: 403 }
      );
    }

    const { academicYear, semester } = group.classroom;

    const tahsin = await prisma.tahsinScore.findMany({
      where: { studentId, academicYear, semester },
      select: {
        id: true,
        tahsinType: true,
        topic: true,
        scoreNumeric: true,
        scoreLetter: true,
        description: true,
      },
    });

    const tahfidz = await prisma.tahfidzScore.findMany({
      where: { studentId, academicYear, semester },
      select: {
        id: true,
        surahId: true,
        scoreNumeric: true,
        scoreLetter: true,
        description: true,
        surah: { select: { name: true } },
      },
    });

    return NextResponse.json({ tahsin, tahfidz });
  } catch (error) {
    console.error('[GET_SCORE_ERROR]', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data nilai' },
      { status: 500 }
    );
  }
}
