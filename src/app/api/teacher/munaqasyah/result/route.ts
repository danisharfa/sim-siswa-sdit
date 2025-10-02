import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role, MunaqasyahRequestStatus, MunaqasyahStage } from '@prisma/client';
import {
  calculateTasmiTotalScore,
  calculateMunaqasyahTotalScore,
  scoreToGrade,
  validateTasmiDetails,
  validateMunaqasyahDetails,
  TasmiDetailInput,
  MunaqasyahDetailInput,
  calculateFinalScore,
} from '@/lib/utils/munaqasyah-scoring';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.teacher) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!teacher) {
      return NextResponse.json(
        { success: false, message: 'Guru tidak ditemukan' },
        { status: 404 }
      );
    }

    const whereClause = {
      OR: [
        { request: { teacherId: teacher.userId } },
        { schedule: { examinerId: teacher.userId } },
      ],
    };

    const results = await prisma.munaqasyahResult.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        request: {
          select: {
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
            batch: true,
          },
        },
        schedule: {
          select: { date: true, sessionName: true, startTime: true, endTime: true, location: true },
        },
        // ⬇️ tambahkan initialScore untuk hitung persentase
        tasmiScores: { select: { initialScore: true, totalScore: true } },
        // ⬇️ di detail munaqasyah totalScore = raw basis 50; initialScore fix 50 untuk persentase
        munaqasyahScores: { select: { totalScore: true } },
      },
    });

    // Ambil final results untuk penautan
    const finalResults = await prisma.munaqasyahFinalResult.findMany({
      include: {
        juz: { select: { id: true, name: true } },
        student: { select: { userId: true, nis: true, user: { select: { fullName: true } } } },
        group: {
          select: {
            name: true,
            classroom: { select: { name: true, academicYear: true, semester: true } },
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
    const finalMap = new Map(
      finalResults.map((fr) => [`${fr.studentId}_${fr.juzId}_${fr.batch}`, fr])
    );

    const formatted = results.map((r) => {
      // Skor utama sudah dinormalisasi 0–100
      const score = r.totalScore;

      // Rata-rata Tasmi (raw & %)
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

      // Rata-rata Munaqasyah (raw basis 50 & %)
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
      const fr = finalMap.get(finalKey);

      return {
        id: r.id,
        score, // 0–100
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
                rawAverage: tasmiRawAvg, // contoh: 72 (jika 44 & 100)
                percentAverage: tasmiPercentAvg, // contoh: 93.3
              }
            : null,
          munaqasyah: r.munaqasyahScores.length
            ? {
                rawAverage: munaRawAvg, // basis 50
                percentAverage: munaPercentAvg, // 0–100
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
    if (!session || session.user.role !== Role.teacher) {
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

    // helper: clamp 0..100
    // const clamp100 = (n: number) => Math.max(0, Math.min(100, n));

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

      const totalScore = calculatedScore; // ⬅️ sudah 1 desimal dari util
      const grade = scoreToGrade(totalScore);
      const passed = totalScore >= 80;

      const result = await prisma.munaqasyahResult.create({
        data: {
          requestId,
          scheduleId,
          totalScore, // ⬅️ 1 desimal
          grade,
          passed,
        },
      });

      // simpan detail: detailsToSave.totalScore = persen 1 desimal
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
          totalScore: detail.totalScore, // ⬅️ persen 1 desimal (88.0, 98.5, ...)
          note: detail.note ?? null,
        })),
      });

      // Opsional: auto-create next request (MUNAQASYAH) bila lulus
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

      // MUNAQASYAH
      const { totalScore: calculatedScore, detailsToSave } = calculateMunaqasyahTotalScore(
        munaqasyahDetails as MunaqasyahDetailInput[]
      );

      const totalScore = calculatedScore; // ⬅️ 1 desimal dari util
      const grade = scoreToGrade(totalScore);
      const passed = totalScore >= 80;

      const result = await prisma.munaqasyahResult.create({
        data: {
          requestId,
          scheduleId,
          totalScore, // ⬅️ 1 desimal
          grade,
          passed,
        },
      });

      await prisma.munaqasyahDetail.createMany({
        data: detailsToSave.map((c) => ({
          resultId: result.id,
          questionNo: c.questionNo,
          initialScore: 50,
          khofiAwalAyat: c.khofiAwalAyat ?? 0,
          khofiMakhroj: c.khofiMakhroj ?? 0,
          khofiTajwidMad: c.khofiTajwidMad ?? 0,
          jaliBaris: c.jaliBaris ?? 0,
          jaliLebihSatuKalimat: c.jaliLebihSatuKalimat ?? 0,
          totalScore: c.totalScore, // tetap raw basis 50
          note: c.note ?? null,
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

      // Final result (pakai util yg sudah round1)
      if (tasmi) {
        const finalScore = calculateFinalScore(tasmi.totalScore, totalScore); // ⬅️ 1 desimal
        const finalGrade = scoreToGrade(finalScore);
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
            finalScore, // ⬅️ 1 desimal
            finalGrade,
            passed: finalScore >= 80,
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
            passed: finalScore >= 80,
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
    console.error('[POST_TEACHER_MUNAQASYAH_RESULT]', error);
    return NextResponse.json({ success: false, message: 'Gagal menyimpan hasil' }, { status: 500 });
  }
}
