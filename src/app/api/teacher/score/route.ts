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
    });

    if (!group) {
      return NextResponse.json(
        { error: 'Kelompok tidak ditemukan atau tidak milik guru ini' },
        { status: 403 }
      );
    }

    const tahsinAvg = tahsin.length
      ? tahsin.reduce((sum, t) => sum + t.scoreNumeric, 0) / tahsin.length
      : null;

    const tahfidzAvg = tahfidz.length
      ? tahfidz.reduce((sum, t) => sum + t.scoreNumeric, 0) / tahfidz.length
      : null;

    await prisma.$transaction(async (tx) => {
      // Delete existing Tahsin Scores
      await tx.tahsinScore.deleteMany({
        where: {
          studentId,
          groupId,
        },
      });

      // Create new Tahsin Scores
      if (tahsin.length > 0) {
        await tx.tahsinScore.createMany({
          data: tahsin.map((item) => ({
            studentId,
            groupId,
            tahsinType: item.type,
            topic: item.topic,
            scoreNumeric: item.scoreNumeric,
            scoreLetter: item.scoreLetter,
            description: item.description,
          })),
        });
      }

      // Delete existing Tahfidz Scores
      await tx.tahfidzScore.deleteMany({
        where: {
          studentId,
          groupId,
        },
      });

      // Create new Tahfidz Scores
      if (tahfidz.length > 0) {
        await tx.tahfidzScore.createMany({
          data: tahfidz.map((item) => ({
            studentId,
            groupId,
            surahId: item.surahId,
            scoreNumeric: item.scoreNumeric,
            scoreLetter: item.scoreLetter,
            description: item.description,
          })),
        });
      }

      // Update or create Report
      await tx.report.upsert({
        where: {
          studentId_groupId_academicYear_semester: {
            studentId,
            groupId,
            academicYear: group.classroom.academicYear,
            semester: group.classroom.semester,
          },
        },
        update: {
          tahfidzScore: tahfidzAvg,
          tahsinScore: tahsinAvg,
          lastTahsinMaterial: lastMaterial?.trim() || null,
        },
        create: {
          studentId,
          groupId,
          academicYear: group.classroom.academicYear,
          semester: group.classroom.semester,
          tahfidzScore: tahfidzAvg,
          tahsinScore: tahsinAvg,
          lastTahsinMaterial: lastMaterial?.trim() || null,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[TEACHER_SCORE_POST]', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat menyimpan nilai' }, { status: 500 });
  }
}
