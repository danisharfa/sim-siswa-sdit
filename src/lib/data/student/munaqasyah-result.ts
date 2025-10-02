import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role } from '@prisma/client';

export async function fetchMunaqasyahResult() {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.student) {
      throw new Error('Unauthorized');
    }

    const student = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!student) {
      throw new Error('Profil siswa tidak ditemukan');
    }

    const results = await prisma.munaqasyahResult.findMany({
      orderBy: { createdAt: 'desc' },
      where: {
        request: {
          studentId: student.userId,
        },
      },
      include: {
        request: {
          select: {
            id: true,
            batch: true,
            stage: true,
            status: true,
            juz: { select: { name: true } },
            student: {
              select: {
                nis: true,
                user: { select: { fullName: true } },
              },
            },
            teacher: {
              select: {
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
          },
        },
        schedule: {
          select: {
            date: true,
            sessionName: true,
            startTime: true,
            endTime: true,
            location: true,
            examiner: {
              select: {
                user: { select: { fullName: true } },
              },
            },
          },
        },
        tasmiScores: {
          select: {
            surahId: true,
            initialScore: true,
            khofiAwalAyat: true,
            khofiMakhroj: true,
            khofiTajwidMad: true,
            jaliBaris: true,
            jaliLebihSatuKalimat: true,
            totalScore: true,
            note: true,
          },
        },
        munaqasyahScores: {
          select: {
            questionNo: true,
            initialScore: true,
            khofiAwalAyat: true,
            khofiMakhroj: true,
            khofiTajwidMad: true,
            jaliBaris: true,
            jaliLebihSatuKalimat: true,
            totalScore: true,
            note: true,
          },
        },
        // Include final result if this result is used in final calculation
        tasmiForFinal: {
          select: {
            finalScore: true,
            finalGrade: true,
            passed: true,
          },
        },
        munaqasyahForFinal: {
          select: {
            finalScore: true,
            finalGrade: true,
            passed: true,
          },
        },
      },
    });

    return results.map((result) => {
      // Use the totalScore directly from the result
      const score = result.totalScore;

      // Get final result (if any)
      const finalResult = result.tasmiForFinal || result.munaqasyahForFinal;

      // Aggregate scores for display
      const tasmiScoreDetails =
        result.tasmiScores.length > 0
          ? {
              totalScore:
                result.tasmiScores.reduce((sum, detail) => sum + detail.totalScore, 0) /
                result.tasmiScores.length,
              details: result.tasmiScores,
            }
          : null;

      const munaqasyahScoreDetails =
        result.munaqasyahScores.length > 0
          ? {
              totalScore:
                result.munaqasyahScores.reduce((sum, detail) => sum + detail.totalScore, 0) /
                result.munaqasyahScores.length,
              details: result.munaqasyahScores,
            }
          : null;

      return {
        ...result,
        score,
        scoreDetails: {
          tasmi: tasmiScoreDetails,
          munaqasyah: munaqasyahScoreDetails,
        },
        finalResult: finalResult
          ? {
              finalScore: finalResult.finalScore,
              finalGrade: finalResult.finalGrade,
              passed: finalResult.passed,
            }
          : null,
        createdAt: result.createdAt.toISOString(),
        updatedAt: result.updatedAt.toISOString(),
        schedule: {
          ...result.schedule,
          date: result.schedule.date.toISOString(),
        },
      };
    });
  } catch (error) {
    console.error('[FETCH_MUNAQASYAH_RESULT]', error);
    throw new Error('Gagal mengambil data hasil munaqasyah');
  }
}
