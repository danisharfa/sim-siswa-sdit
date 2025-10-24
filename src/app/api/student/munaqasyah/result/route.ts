import { auth } from '@/auth';
import { Role } from '@prisma/client';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.student) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const student = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Profil siswa tidak ditemukan' },
        { status: 404 }
      );
    }

    const data = await prisma.munaqasyahResult.findMany({
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

    const formattedData = data.map((d) => {
      // Use the totalScore directly from the result
      const score = d.totalScore;

      // Get final result (if any)
      const finalResult = d.tasmiForFinal || d.munaqasyahForFinal;

      // Aggregate scores for display
      const tasmiScoreDetails =
        d.tasmiScores.length > 0
          ? {
              totalScore:
                d.tasmiScores.reduce((sum, detail) => sum + detail.totalScore, 0) /
                d.tasmiScores.length,
              details: d.tasmiScores,
            }
          : null;

      const munaqasyahScoreDetails =
        d.munaqasyahScores.length > 0
          ? {
              totalScore:
                d.munaqasyahScores.reduce((sum, detail) => sum + detail.totalScore, 0) /
                d.munaqasyahScores.length,
              details: d.munaqasyahScores,
            }
          : null;

      return {
        ...d,
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
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
        schedule: {
          ...d.schedule,
          date: d.schedule.date.toISOString(),
        },
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Hasil Munaqasyah berhasil diambil',
      data: formattedData,
    });
  } catch (error) {
    console.error('Gagal mengambil Hasil Munaqasyah:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil Hasil Munaqasyah' },
      { status: 500 }
    );
  }
}
