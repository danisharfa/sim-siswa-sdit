import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role, TahsinType, GradeLetter } from '@prisma/client';

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
  lastMaterial?: string;
}

// Untuk menyimpan nilai Tahsin dan Tahfidz
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.teacher) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!teacher) {
      return NextResponse.json({ error: 'Guru tidak ditemukan' }, { status: 404 });
    }

    const body = (await req.json()) as ScoreRequestBody;
    const { studentId, groupId, tahsin, tahfidz, lastMaterial } = body;

    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        teacherGroups: { some: { teacherId: teacher.id } },
        students: { some: { id: studentId } },
      },
      include: { classroom: true },
    });

    if (!group) {
      return NextResponse.json(
        { error: 'Kelompok tidak ditemukan atau tidak milik guru ini' },
        { status: 403 }
      );
    }

    const { academicYear, semester } = group.classroom;

    const tahsinAvg = tahsin.length
      ? tahsin.reduce((sum, t) => sum + t.scoreNumeric, 0) / tahsin.length
      : null;

    const tahfidzAvg = tahfidz.length
      ? tahfidz.reduce((sum, t) => sum + t.scoreNumeric, 0) / tahfidz.length
      : null;

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
      // Update TahsinSummary
      if (tahsinAvg !== null) {
        await tx.tahsinSummary.upsert({
          where: {
            studentId_academicYear_semester: {
              studentId,
              academicYear,
              semester,
            },
          },
          update: {
            averageScore: tahsinAvg,
            lastMaterial: lastMaterial?.trim() || null,
          },
          create: {
            studentId,
            academicYear,
            semester,
            averageScore: tahsinAvg,
            lastMaterial: lastMaterial?.trim() || null,
          },
        });
      }

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
      // Update TahfidzSummary
      if (tahfidzAvg !== null) {
        await tx.tahfidzSummary.upsert({
          where: {
            studentId_academicYear_semester: {
              studentId,
              academicYear,
              semester,
            },
          },
          update: {
            averageScore: tahfidzAvg,
          },
          create: {
            studentId,
            academicYear,
            semester,
            averageScore: tahfidzAvg,
          },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[TEACHER_SCORE_POST]', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat menyimpan nilai' }, { status: 500 });
  }
}
