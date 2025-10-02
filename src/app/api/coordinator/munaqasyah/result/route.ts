import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role, MunaqasyahRequestStatus, MunaqasyahStage } from '@prisma/client';
import {
  calculateTasmiTotalScore,
  calculateMunaqasyahTotalScore,
  calculateFinalScore,
  scoreToGrade,
  validateTasmiDetails,
  validateMunaqasyahDetails,
  TasmiDetailInput,
  MunaqasyahDetailInput,
} from '@/lib/utils/munaqasyah-scoring';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.coordinator) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const results = await prisma.munaqasyahResult.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        request: {
          select: {
            batch: true,
            stage: true,
            studentId: true,
            juz: { select: { id: true, name: true } },
            student: { select: { nis: true, user: { select: { fullName: true } } } },
            group: {
              select: {
                name: true,
                classroom: { select: { name: true, academicYear: true, semester: true } },
              },
            },
          },
        },
        schedule: {
          select: { date: true, sessionName: true, startTime: true, endTime: true, location: true },
        },
        // ⬇️ include initialScore untuk persentase
        tasmiScores: { select: { initialScore: true, totalScore: true, note: true } },
        munaqasyahScores: { select: { totalScore: true, note: true } },
      },
    });

    // Get final results for students who have completed both stages
    const finalResults = await prisma.munaqasyahFinalResult.findMany({
      include: {
        juz: { select: { id: true, name: true } },
        student: {
          select: {
            nis: true,
            user: { select: { fullName: true } },
          },
        },
        group: {
          select: {
            name: true,
            classroom: {
              select: {
                name: true,
                academicYear: true,
                semester: true,
              },
            },
          },
        },
        tasmiResult: {
          include: {
            schedule: {
              select: {
                date: true,
                sessionName: true,
                startTime: true,
                endTime: true,
                location: true,
              },
            },
          },
        },
        munaqasyahResult: {
          include: {
            schedule: {
              select: {
                date: true,
                sessionName: true,
                startTime: true,
                endTime: true,
                location: true,
              },
            },
          },
        },
      },
    });

    // Create a map of final results by student+juz+batch
    const finalResultMap = new Map<string, (typeof finalResults)[0]>();
    finalResults.forEach((fr) => {
      const key = `${fr.studentId}_${fr.juzId}_${fr.batch}`;
      finalResultMap.set(key, fr);
    });

    const formatted = results.map((r) => {
      const score = r.totalScore;

      let tasmiRawAvg = 0;
      let tasmiPercentAvg = 0;
      if (r.tasmiScores.length > 0) {
        tasmiRawAvg =
          r.tasmiScores.reduce((acc, d) => acc + d.totalScore, 0) / r.tasmiScores.length;
        tasmiPercentAvg =
          r.tasmiScores.reduce((acc, d) => {
            const init = Math.max(1, d.initialScore ?? 0);
            return acc + (init > 0 ? (d.totalScore / init) * 100 : 0);
          }, 0) / r.tasmiScores.length;
      }

      let munaRawAvg = 0;
      let munaPercentAvg = 0;
      if (r.munaqasyahScores.length > 0) {
        munaRawAvg =
          r.munaqasyahScores.reduce((acc, d) => acc + d.totalScore, 0) / r.munaqasyahScores.length;
        munaPercentAvg =
          r.munaqasyahScores.reduce((acc, d) => acc + (d.totalScore / 50) * 100, 0) /
          r.munaqasyahScores.length;
      }

      const finalKey = `${r.request.studentId}_${r.request.juz.id}_${r.request.batch}`;
      const fr = finalResultMap.get(finalKey);

      return {
        id: r.id,
        score,
        grade: r.grade,
        passed: r.passed,
        schedule: r.schedule,
        academicYear: r.request.group.classroom.academicYear,
        semester: r.request.group.classroom.semester,
        classroomName: r.request.group.classroom.name,
        groupName: r.request.group.name,
        batch: r.request.batch,
        stage: r.request.stage,
        juz: r.request.juz,
        student: r.request.student,
        scoreDetails: {
          tasmi: r.tasmiScores.length
            ? {
                rawAverage: tasmiRawAvg,
                percentAverage: tasmiPercentAvg,
              }
            : null,
          munaqasyah: r.munaqasyahScores.length
            ? {
                rawAverage: munaRawAvg,
                percentAverage: munaPercentAvg,
              }
            : null,
        },
        finalResult: fr
          ? {
              id: fr.id,
              finalScore: fr.finalScore,
              finalGrade: fr.finalGrade,
              passed: fr.passed,
              createdAt: fr.createdAt.toISOString(),
            }
          : null,
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error('[GET_MUNAQASYAH_RESULT]', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data hasil munaqasyah' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (
      !session ||
      (session.user.role !== Role.teacher && session.user.role !== Role.coordinator)
    ) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { scheduleId, requestId, stage, tasmiDetails, munaqasyahDetails } = body as {
      scheduleId: string;
      requestId: string;
      stage: MunaqasyahStage;
      tasmiDetails?: Array<{
        surahId: number;
        initialScore: number;
        khofiAwalAyat: number;
        khofiMakhroj: number;
        khofiTajwidMad: number;
        jaliBaris: number;
        jaliLebihSatuKalimat: number;
        note?: string;
      }>;
      munaqasyahDetails?: Array<{
        questionNo: number;
        khofiAwalAyat: number;
        khofiMakhroj: number;
        khofiTajwidMad: number;
        jaliBaris: number;
        jaliLebihSatuKalimat: number;
        note?: string;
      }>;
    };

    if (!scheduleId || !requestId || !stage) {
      return NextResponse.json({ success: false, message: 'Data tidak lengkap' }, { status: 400 });
    }

    const request = await prisma.munaqasyahRequest.findUnique({
      where: { id: requestId },
      include: {
        student: {
          select: {
            userId: true,
            group: {
              select: { id: true, classroom: { select: { academicYear: true, semester: true } } },
            },
          },
        },
        teacher: { select: { userId: true } },
        juz: { select: { id: true } },
      },
    });

    if (!request) {
      return NextResponse.json(
        { success: false, message: 'Permintaan tidak ditemukan' },
        { status: 404 }
      );
    }

    // pastikan belum ada result utk request ini (1 request = 1 result)
    const existing = await prisma.munaqasyahResult.findFirst({
      where: { requestId },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Hasil untuk request ini sudah ada' },
        { status: 400 }
      );
    }

    // let totalScore = 0;

    if (stage === MunaqasyahStage.TASMI) {
      // Validate input
      const validation = validateTasmiDetails(tasmiDetails || []);
      if (!validation.isValid) {
        return NextResponse.json({ success: false, message: validation.error }, { status: 400 });
      }

      // TASMI
      const { totalScore: calculatedScore, detailsToSave } = calculateTasmiTotalScore(
        tasmiDetails as TasmiDetailInput[]
      );

      const totalScore = calculatedScore; // 1 desimal
      const grade = scoreToGrade(totalScore);
      const passed = totalScore >= 80;

      const result = await prisma.munaqasyahResult.create({
        data: {
          requestId,
          scheduleId,
          totalScore, // Sudah dinormalisasi 0-100
          grade,
          passed,
        },
      });

      await prisma.tasmiDetail.createMany({
        data: detailsToSave.map((detail) => ({
          resultId: result.id,
          surahId: detail.surahId,
          initialScore: detail.initialScore,
          khofiAwalAyat: detail.khofiAwalAyat,
          khofiMakhroj: detail.khofiMakhroj,
          khofiTajwidMad: detail.khofiTajwidMad,
          jaliBaris: detail.jaliBaris,
          jaliLebihSatuKalimat: detail.jaliLebihSatuKalimat,
          totalScore: detail.totalScore, // persen 1 desimal
          note: detail.note || undefined,
        })),
      });

      // Auto-create next request (MUNAQASYAH) bila lulus
      if (passed) {
        const existNext = await prisma.munaqasyahRequest.findFirst({
          where: {
            studentId: request.studentId,
            juzId: request.juzId,
            batch: request.batch,
            stage: MunaqasyahStage.MUNAQASYAH,
          },
        });
        if (!existNext) {
          await prisma.munaqasyahRequest.create({
            data: {
              studentId: request.studentId,
              teacherId: request.teacherId,
              groupId: request.groupId,
              juzId: request.juzId,
              batch: request.batch,
              stage: MunaqasyahStage.MUNAQASYAH,
              status: MunaqasyahRequestStatus.MENUNGGU,
            },
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Hasil Tasmi disimpan',
        data: { id: result.id },
      });
    }

    if (stage === MunaqasyahStage.MUNAQASYAH) {
      // Validate input
      const validation = validateMunaqasyahDetails(munaqasyahDetails || []);
      if (!validation.isValid) {
        return NextResponse.json({ success: false, message: validation.error }, { status: 400 });
      }

      // Calculate scores using utility function
      const { totalScore: calculatedScore, detailsToSave } = calculateMunaqasyahTotalScore(
        munaqasyahDetails as MunaqasyahDetailInput[]
      );

      const totalScore = calculatedScore; // 1 desimal
      const grade = scoreToGrade(totalScore);
      const passed = totalScore >= 80;

      const result = await prisma.munaqasyahResult.create({
        data: {
          requestId,
          scheduleId,
          totalScore, // Sudah dinormalisasi 0-100
          grade,
          passed,
        },
      });

      await prisma.munaqasyahDetail.createMany({
        data: detailsToSave.map((detail) => ({
          resultId: result.id,
          questionNo: detail.questionNo,
          initialScore: 50, // Fixed rule
          khofiAwalAyat: detail.khofiAwalAyat,
          khofiMakhroj: detail.khofiMakhroj,
          khofiTajwidMad: detail.khofiTajwidMad,
          jaliBaris: detail.jaliBaris,
          jaliLebihSatuKalimat: detail.jaliLebihSatuKalimat,
          totalScore: detail.totalScore, // Raw score basis 50
          note: detail.note || undefined,
        })),
      });

      // Buat FINAL jika TASMI sudah ada
      const tasmi = await prisma.munaqasyahResult.findFirst({
        where: {
          request: {
            studentId: request.studentId,
            juzId: request.juzId,
            batch: request.batch,
            stage: MunaqasyahStage.TASMI,
          },
        },
      });

      if (tasmi) {
        const finalScore = calculateFinalScore(tasmi.totalScore, totalScore); // 1 desimal
        const finalGrade = scoreToGrade(finalScore);
        const finalPassed = finalScore >= 80;

        await prisma.munaqasyahFinalResult.upsert({
          where: {
            // kombinasi unik siswa+juz+batch
            studentId_juzId_batch: {
              studentId: request.studentId,
              juzId: request.juzId,
              batch: request.batch,
            },
          },
          update: {
            tasmiResultId: tasmi.id,
            munaqasyahResultId: result.id,
            finalScore,
            finalGrade,
            passed: finalPassed,
          },
          create: {
            studentId: request.studentId,
            groupId: request.groupId,
            juzId: request.juzId,
            batch: request.batch,
            tasmiResultId: tasmi.id,
            munaqasyahResultId: result.id,
            finalScore,
            finalGrade,
            passed: finalPassed,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Hasil Munaqasyah disimpan',
        data: { id: result.id },
      });
    }

    return NextResponse.json({ success: false, message: 'Stage tidak valid' }, { status: 400 });
  } catch (error) {
    console.error('[POST_COORDINATOR_MUNAQASYAH_RESULT]', error);
    return NextResponse.json({ success: false, message: 'Gagal menyimpan hasil' }, { status: 500 });
  }
}
