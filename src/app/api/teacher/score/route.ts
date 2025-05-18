import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { TahsinType, GradeLetter } from '@prisma/client';

interface TahsinInput {
  type: TahsinType;
  topic: string;
  scoreNumeric: number;
  scoreLetter: GradeLetter;
  description: string;
}

interface TahfidzInput {
  surahId: number;
  scoreNumeric: number;
  scoreLetter: GradeLetter;
  description: string;
}

interface ScoreRequestBody {
  studentId: string;
  groupId: string;
  tahsin: TahsinInput[];
  tahfidz: TahfidzInput[];
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as ScoreRequestBody;

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Guru tidak ditemukan' }, { status: 404 });
    }

    const { studentId, groupId, tahsin, tahfidz } = body;

    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
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
        { error: 'Kelompok tidak ditemukan atau tidak milik guru ini' },
        { status: 403 }
      );
    }

    const { academicYear, semester } = group.classroom;

    // Simpan nilai Tahsin
    await prisma.$transaction(async (tx) => {
      await tx.tahsinScore.deleteMany({
        where: {
          studentId,
          academicYear,
          semester,
        },
      });

      await tx.tahsinScore.createMany({
        data: tahsin.map((item) => ({
          studentId,
          academicYear,
          semester,
          tahsinType: item.type,
          topic: item.topic,
          scoreNumeric: item.scoreNumeric,
          scoreLetter: item.scoreLetter,
          description: item.description,
        })),
      });

      // Simpan nilai Tahfidz
      await tx.tahfidzScore.deleteMany({
        where: {
          studentId,
          academicYear,
          semester,
        },
      });

      await tx.tahfidzScore.createMany({
        data: tahfidz.map((item) => ({
          studentId,
          academicYear,
          semester,
          surahId: item.surahId,
          scoreNumeric: item.scoreNumeric,
          scoreLetter: item.scoreLetter,
          description: item.description,
        })),
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[TEACHER_SCORE_POST]', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat menyimpan nilai' }, { status: 500 });
  }
}
