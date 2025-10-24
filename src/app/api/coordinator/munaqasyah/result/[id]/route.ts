import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role, MunaqasyahGrade, MunaqasyahStage } from '@prisma/client';
import { calculateFinalScore, scoreToGrade } from '@/lib/utils/munaqasyah-scoring';

type Params = Promise<{ id: string }>;

interface TasmiDetailInput {
  surahId: number;
  initialScore: number;
  khofiAwalAyat: number;
  khofiMakhroj: number;
  khofiTajwidMad: number;
  jaliBaris: number;
  jaliLebihSatuKalimat: number;
  note?: string;
}

interface MunaqasyahDetailInput {
  questionNo: number;
  khofiAwalAyat: number;
  khofiMakhroj: number;
  khofiTajwidMad: number;
  jaliBaris: number;
  jaliLebihSatuKalimat: number;
  note?: string;
}

// Helper function to calculate total score for tasmi
function calculateTasmiScore(details: TasmiDetailInput[]): number {
  if (!details || details.length === 0) return 0;
  const totalPercent = details.reduce((sum, detail) => {
    const {
      initialScore,
      khofiAwalAyat,
      khofiMakhroj,
      khofiTajwidMad,
      jaliBaris,
      jaliLebihSatuKalimat,
    } = detail;
    const khofi = (khofiAwalAyat || 0) + (khofiMakhroj || 0) + (khofiTajwidMad || 0);
    const jali = (jaliBaris || 0) + (jaliLebihSatuKalimat || 0);
    const rawScore = Math.max(0, (initialScore || 0) - 2 * khofi - 5 * jali);
    const percent = initialScore > 0 ? (rawScore / initialScore) * 100 : 0;
    return sum + percent;
  }, 0);
  return totalPercent / details.length;
}

// Helper function to calculate total score for munaqasyah
function calculateMunaqasyahScore(details: MunaqasyahDetailInput[]): number {
  if (!details || details.length === 0) return 0;
  const totalPercent = details.reduce((sum, detail) => {
    const { khofiAwalAyat, khofiMakhroj, khofiTajwidMad, jaliBaris, jaliLebihSatuKalimat } = detail;
    const khofi = (khofiAwalAyat || 0) + (khofiMakhroj || 0) + (khofiTajwidMad || 0);
    const jali = (jaliBaris || 0) + (jaliLebihSatuKalimat || 0);
    const rawScore = Math.max(0, 50 - 2 * khofi - 3 * jali);
    const percent = (rawScore / 50) * 100;
    return sum + percent;
  }, 0);
  return totalPercent / details.length;
}

// Helper function to determine grade and pass status
function determineGradeAndStatus(totalScore: number): { grade: MunaqasyahGrade; passed: boolean } {
  if (totalScore >= 85) return { grade: MunaqasyahGrade.MUMTAZ, passed: true };
  if (totalScore >= 75) return { grade: MunaqasyahGrade.JAYYID_JIDDAN, passed: true };
  if (totalScore >= 65) return { grade: MunaqasyahGrade.JAYYID, passed: true };
  return { grade: MunaqasyahGrade.TIDAK_LULUS, passed: false };
}

// Helper function to update MunaqasyahFinalResult
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function updateFinalResult(tx: any, updatedResult: any, existingResult: any) {
  const request = existingResult.request;

  // Find the other result (TASMI or MUNAQASYAH)
  const otherStage =
    request.stage === MunaqasyahStage.TASMI ? MunaqasyahStage.MUNAQASYAH : MunaqasyahStage.TASMI;

  const otherResult = await tx.munaqasyahResult.findFirst({
    where: {
      request: {
        studentId: request.studentId,
        juzId: request.juzId,
        batch: request.batch,
        stage: otherStage,
      },
    },
  });

  // If both results exist, update final result
  if (otherResult) {
    const tasmiResult = request.stage === MunaqasyahStage.TASMI ? updatedResult : otherResult;
    const munaqasyahResult =
      request.stage === MunaqasyahStage.MUNAQASYAH ? updatedResult : otherResult;

    const finalScore = calculateFinalScore(tasmiResult.totalScore, munaqasyahResult.totalScore);
    const finalGrade = scoreToGrade(finalScore);
    const finalPassed = finalScore >= 80;

    await tx.munaqasyahFinalResult.upsert({
      where: {
        studentId_juzId_batch: {
          studentId: request.studentId,
          juzId: request.juzId,
          batch: request.batch,
        },
      },
      update: {
        tasmiResultId: tasmiResult.id,
        munaqasyahResultId: munaqasyahResult.id,
        finalScore,
        finalGrade,
        passed: finalPassed,
      },
      create: {
        studentId: request.studentId,
        groupId: request.groupId,
        juzId: request.juzId,
        batch: request.batch,
        tasmiResultId: tasmiResult.id,
        munaqasyahResultId: munaqasyahResult.id,
        finalScore,
        finalGrade,
        passed: finalPassed,
      },
    });
  }
}

export async function PUT(req: NextRequest, segmentData: { params: Params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.coordinator) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await segmentData.params;
    const { tasmiDetails, munaqasyahDetails } = await req.json();

    // Validate input
    if (!tasmiDetails && !munaqasyahDetails) {
      return NextResponse.json(
        { success: false, message: 'Data penilaian harus diisi' },
        { status: 400 }
      );
    }

    const existingResult = await prisma.munaqasyahResult.findUnique({
      where: { id },
      include: {
        request: {
          include: {
            student: { include: { user: true } },
          },
        },
        tasmiScores: true,
        munaqasyahScores: true,
      },
    });

    if (!existingResult) {
      return NextResponse.json(
        { success: false, message: 'Hasil munaqasyah tidak ditemukan' },
        { status: 404 }
      );
    }

    // Calculate scores
    const tasmiScore = tasmiDetails ? calculateTasmiScore(tasmiDetails) : 0;
    const munaqasyahScore = munaqasyahDetails ? calculateMunaqasyahScore(munaqasyahDetails) : 0;
    const totalScore =
      tasmiDetails && munaqasyahDetails
        ? (tasmiScore + munaqasyahScore) / 2
        : tasmiScore || munaqasyahScore;

    const { grade, passed } = determineGradeAndStatus(totalScore);

    // Use transaction to update result and details
    const updatedResult = await prisma.$transaction(async (tx) => {
      // Delete existing detail records
      await tx.tasmiDetail.deleteMany({ where: { resultId: id } });
      await tx.munaqasyahDetail.deleteMany({ where: { resultId: id } });

      // Create new detail records
      if (tasmiDetails) {
        await tx.tasmiDetail.createMany({
          data: tasmiDetails.map((detail: TasmiDetailInput) => ({
            resultId: id,
            surahId: detail.surahId,
            initialScore: detail.initialScore,
            khofiAwalAyat: detail.khofiAwalAyat || 0,
            khofiMakhroj: detail.khofiMakhroj || 0,
            khofiTajwidMad: detail.khofiTajwidMad || 0,
            jaliBaris: detail.jaliBaris || 0,
            jaliLebihSatuKalimat: detail.jaliLebihSatuKalimat || 0,
            totalScore: calculateTasmiScore([detail]),
            note: detail.note || null,
          })),
        });
      }

      if (munaqasyahDetails) {
        await tx.munaqasyahDetail.createMany({
          data: munaqasyahDetails.map((detail: MunaqasyahDetailInput) => ({
            resultId: id,
            questionNo: detail.questionNo,
            initialScore: 50,
            khofiAwalAyat: detail.khofiAwalAyat || 0,
            khofiMakhroj: detail.khofiMakhroj || 0,
            khofiTajwidMad: detail.khofiTajwidMad || 0,
            jaliBaris: detail.jaliBaris || 0,
            jaliLebihSatuKalimat: detail.jaliLebihSatuKalimat || 0,
            totalScore: calculateMunaqasyahScore([detail]),
            note: detail.note || null,
          })),
        });
      }

      // Update main result
      const updatedResult = await tx.munaqasyahResult.update({
        where: { id },
        data: {
          totalScore,
          grade,
          passed,
        },
      });

      // Update MunaqasyahFinalResult if exists
      await updateFinalResult(tx, updatedResult, existingResult);

      return updatedResult;
    });

    return NextResponse.json({
      success: true,
      message: 'Hasil Munaqasyah berhasil diperbarui',
      data: updatedResult,
    });
  } catch (error) {
    console.error('Gagal memperbarui Hasil Munaqasyah:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memperbarui Hasil Munaqasyah' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, segmentData: { params: Params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.coordinator) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await segmentData.params;

    const existingResult = await prisma.munaqasyahResult.findUnique({
      where: { id },
      include: {
        request: {
          include: {
            student: { include: { user: true } },
          },
        },
      },
    });

    console.log('Existing munaqasyah result:', {
      id: existingResult?.id,
      studentName: existingResult?.request.student.user.fullName,
      passed: existingResult?.passed,
    });

    if (!existingResult) {
      return NextResponse.json(
        { success: false, message: 'Hasil munaqasyah tidak ditemukan' },
        { status: 404 }
      );
    }

    // Use transaction to delete result and related details
    await prisma.$transaction(async (tx) => {
      // Delete detail records first
      await tx.tasmiDetail.deleteMany({ where: { resultId: id } });
      await tx.munaqasyahDetail.deleteMany({ where: { resultId: id } });

      // Delete from MunaqasyahFinalResult if this result is referenced
      await tx.munaqasyahFinalResult.deleteMany({
        where: {
          OR: [{ tasmiResultId: id }, { munaqasyahResultId: id }],
        },
      });

      // Delete main result
      await tx.munaqasyahResult.delete({ where: { id } });
    });

    return NextResponse.json({ success: true, message: 'Hasil Munaqasyah berhasil dihapus' });
  } catch (error) {
    console.error('Gagal menghapus Hasil Munaqasyah:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal menghapus Hasil Munaqasyah' },
      { status: 500 }
    );
  }
}
