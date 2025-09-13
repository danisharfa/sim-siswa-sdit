import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role, TahsinType, GradeLetter, AssessmentPeriod } from '@prisma/client';

interface TahsinInput {
  type: TahsinType;
  topic: string;
  score: number;
  grade: GradeLetter;
  description: string;
  period: AssessmentPeriod;
}

interface TahfidzInput {
  surahId: number;
  score: number;
  grade: GradeLetter;
  description: string;
  period: AssessmentPeriod;
}

interface ScoreRequestBody {
  studentId: string;
  groupId: string;
  tahsin: TahsinInput[];
  tahfidz: TahfidzInput[];
  lastMaterial?: string;
  assessmentPeriod: AssessmentPeriod;
}

// Helper function to generate description based on grade and content
function generateTahsinDescription(grade: GradeLetter, topic: string): string {
  switch (grade) {
    case 'A':
      return `Sangat baik dalam memahami ${topic}`;
    case 'B':
      return `Baik dalam memahami ${topic}`;
    case 'C':
      return `Cukup dalam memahami ${topic}`;
    case 'D':
      return `Kurang dalam memahami ${topic}`;
    default:
      return `Perlu evaluasi lebih lanjut dalam memahami ${topic}`;
  }
}

function generateTahfidzDescription(grade: GradeLetter, surahName: string): string {
  switch (grade) {
    case 'A':
      return `Sangat baik dalam memahami ${surahName}`;
    case 'B':
      return `Baik dalam memahami ${surahName}`;
    case 'C':
      return `Cukup dalam memahami ${surahName}`;
    case 'D':
      return `Kurang dalam memahami ${surahName}`;
    default:
      return `Perlu evaluasi lebih lanjut dalam memahami ${surahName}`;
  }
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
    const { studentId, groupId, tahsin, tahfidz, lastMaterial, assessmentPeriod } = body;

    // Get surah names for tahfidz descriptions
    const surahIds = tahfidz.map((item) => item.surahId);
    const surahs = await prisma.surah.findMany({
      where: { id: { in: surahIds } },
      select: { id: true, name: true },
    });
    const surahMap = new Map(surahs.map((s) => [s.id, s.name]));

    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        teacherId: teacher.userId,
        students: { some: { userId: studentId } },
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
      ? tahsin.reduce((sum, t) => sum + t.score, 0) / tahsin.length
      : null;

    const tahfidzAvg = tahfidz.length
      ? tahfidz.reduce((sum, t) => sum + t.score, 0) / tahfidz.length
      : null;

    await prisma.$transaction(async (tx) => {
      // Delete existing Tahsin Scores for this period
      await tx.tahsinScore.deleteMany({
        where: {
          studentId,
          groupId,
          period: assessmentPeriod,
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
            score: item.score,
            grade: item.grade,
            description: generateTahsinDescription(item.grade, item.topic),
            period: assessmentPeriod,
          })),
        });
      }

      // Delete existing Tahfidz Scores for this period
      await tx.tahfidzScore.deleteMany({
        where: {
          studentId,
          groupId,
          period: assessmentPeriod,
        },
      });

      // Create new Tahfidz Scores
      if (tahfidz.length > 0) {
        await tx.tahfidzScore.createMany({
          data: tahfidz.map((item) => ({
            studentId,
            groupId,
            surahId: item.surahId,
            score: item.score,
            grade: item.grade,
            description: generateTahfidzDescription(
              item.grade,
              surahMap.get(item.surahId) || 'Surah'
            ),
            period: assessmentPeriod,
          })),
        });
      }

      // Get existing report
      const existingReport = await tx.report.findUnique({
        where: {
          studentId_groupId_academicYear_semester: {
            studentId,
            groupId,
            academicYear: group.classroom.academicYear,
            semester: group.classroom.semester,
          },
        },
      });

      // Prepare update data based on assessment period
      const updateData: {
        lastTahsinMaterial?: string | null;
        midTahfidzScore?: number | null;
        midTahsinScore?: number | null;
        endTahfidzScore?: number | null;
        endTahsinScore?: number | null;
      } = {
        lastTahsinMaterial: lastMaterial?.trim() || null,
      };

      if (assessmentPeriod === 'MID_SEMESTER') {
        updateData.midTahfidzScore = tahfidzAvg;
        updateData.midTahsinScore = tahsinAvg;
      } else {
        updateData.endTahfidzScore = tahfidzAvg;
        updateData.endTahsinScore = tahsinAvg;
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
        update: updateData,
        create: {
          studentId,
          groupId,
          academicYear: group.classroom.academicYear,
          semester: group.classroom.semester,
          endTahfidzScore:
            assessmentPeriod === 'FINAL' ? tahfidzAvg : existingReport?.endTahfidzScore,
          endTahsinScore: assessmentPeriod === 'FINAL' ? tahsinAvg : existingReport?.endTahsinScore,
          midTahfidzScore:
            assessmentPeriod === 'MID_SEMESTER' ? tahfidzAvg : existingReport?.midTahfidzScore,
          midTahsinScore:
            assessmentPeriod === 'MID_SEMESTER' ? tahsinAvg : existingReport?.midTahsinScore,
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
