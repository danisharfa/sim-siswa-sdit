import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role, MunaqasyahGrade, MunaqasyahRequestStatus, MunaqasyahStage } from '@prisma/client';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.teacher) {
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
          },
        },
        schedule: {
          select: {
            date: true,
            sessionName: true,
            startTime: true,
            endTime: true,
            location: true,
          },
        },
        tasmiScore: {
          select: {
            tajwid: true,
            kelancaran: true,
            adab: true,
            note: true,
            totalScore: true,
          },
        },
        munaqasyahScore: {
          select: {
            tajwid: true,
            kelancaran: true,
            adab: true,
            note: true,
            totalScore: true,
          },
        },
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
      // Get score based on stage
      let score = 0;
      if (r.request.stage === 'TASMI' && r.tasmiScore) {
        score = r.tasmiScore.totalScore;
      } else if (r.request.stage === 'MUNAQASYAH' && r.munaqasyahScore) {
        score = r.munaqasyahScore.totalScore;
      }

      // Check if there's a final result for this student+juz+batch
      const finalResultKey = `${r.request.studentId}_${r.request.juz.id}_${r.request.batch}`;
      const finalResult = finalResultMap.get(finalResultKey);

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
          tasmi: r.tasmiScore,
          munaqasyah: r.munaqasyahScore,
        },
        finalResult: finalResult
          ? {
              id: finalResult.id,
              finalScore: finalResult.finalScore,
              finalGrade: finalResult.finalGrade,
              passed: finalResult.passed,
              createdAt: finalResult.createdAt.toISOString(),
            }
          : null,
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error('[GET_MUNAQASYAH_RESULT]', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengambil data hasil munaqasyah',
      },
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
    const { scheduleId, requestId, stage, tasmi, munaqasyah } = body;

    if (!scheduleId || !requestId || !stage) {
      return NextResponse.json({ success: false, message: 'Data tidak lengkap' }, { status: 400 });
    }

    const request = await prisma.munaqasyahRequest.findUnique({
      where: { id: requestId },
      include: {
        student: {
          select: {
            id: true,
            group: {
              select: {
                id: true,
                classroom: {
                  select: {
                    academicYear: true,
                    semester: true,
                  },
                },
              },
            },
          },
        },
        teacher: { select: { id: true } },
        juz: { select: { id: true } },
      },
    });

    if (!request) {
      return NextResponse.json(
        { success: false, message: 'Permintaan tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check if result already exists
    const existingResult = await prisma.munaqasyahResult.findFirst({
      where: {
        requestId,
        scheduleId,
      },
    });

    if (existingResult) {
      return NextResponse.json(
        { success: false, message: 'Hasil munaqasyah sudah ada untuk permintaan ini' },
        { status: 400 }
      );
    }

    let score = 0;
    let grade: MunaqasyahGrade = MunaqasyahGrade.TIDAK_LULUS;

    // Create score and result based on stage
    if (stage === MunaqasyahStage.TASMI && tasmi) {
      // Validate tasmi scores
      if (
        tasmi.tajwid < 0 ||
        tasmi.tajwid > 100 ||
        tasmi.kelancaran < 0 ||
        tasmi.kelancaran > 100 ||
        tasmi.adab < 0 ||
        tasmi.adab > 100
      ) {
        return NextResponse.json(
          { success: false, message: 'Nilai harus antara 0-100' },
          { status: 400 }
        );
      }

      const total = tasmi.tajwid + tasmi.kelancaran + tasmi.adab;
      score = total / 3;

      // Determine grade based on TASMI score
      if (score >= 91) grade = MunaqasyahGrade.MUMTAZ;
      else if (score >= 85) grade = MunaqasyahGrade.JAYYID_JIDDAN;
      else if (score >= 80) grade = MunaqasyahGrade.JAYYID;

      const passed = score >= 80;

      // Create result first
      const result = await prisma.munaqasyahResult.create({
        data: {
          requestId,
          scheduleId,
          grade,
          passed,
        },
      });

      // Create tasmi score with reference to result
      await prisma.tasmiScore.create({
        data: {
          tajwid: tasmi.tajwid,
          kelancaran: tasmi.kelancaran,
          adab: tasmi.adab,
          note: tasmi.note || null,
          totalScore: score,
          resultId: result.id,
        },
      });

      // Create next stage request if passed
      if (passed) {
        const existingNextRequest = await prisma.munaqasyahRequest.findFirst({
          where: {
            studentId: request.studentId,
            juzId: request.juzId,
            batch: request.batch,
            stage: MunaqasyahStage.MUNAQASYAH,
          },
        });

        if (!existingNextRequest) {
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
        message: 'Hasil Tasmi berhasil disimpan',
        data: result,
      });
    } else if (stage === MunaqasyahStage.MUNAQASYAH && munaqasyah) {
      // Validate munaqasyah scores
      if (
        munaqasyah.tajwid < 0 ||
        munaqasyah.tajwid > 100 ||
        munaqasyah.kelancaran < 0 ||
        munaqasyah.kelancaran > 100 ||
        munaqasyah.adab < 0 ||
        munaqasyah.adab > 100
      ) {
        return NextResponse.json(
          { success: false, message: 'Nilai harus antara 0-100' },
          { status: 400 }
        );
      }

      const total = munaqasyah.tajwid + munaqasyah.kelancaran + munaqasyah.adab;
      score = total / 3;

      // Determine grade based on MUNAQASYAH score
      if (score >= 91) grade = MunaqasyahGrade.MUMTAZ;
      else if (score >= 85) grade = MunaqasyahGrade.JAYYID_JIDDAN;
      else if (score >= 80) grade = MunaqasyahGrade.JAYYID;

      const passed = score >= 80;

      // Create result first
      const result = await prisma.munaqasyahResult.create({
        data: {
          requestId,
          scheduleId,
          grade,
          passed,
        },
      });

      // Create munaqasyah score with reference to result
      await prisma.munaqasyahScore.create({
        data: {
          tajwid: munaqasyah.tajwid,
          kelancaran: munaqasyah.kelancaran,
          adab: munaqasyah.adab,
          note: munaqasyah.note || null,
          totalScore: score,
          resultId: result.id,
        },
      });

      // Check if there's a TASMI result for final calculation
      const tasmiResult = await prisma.munaqasyahResult.findFirst({
        where: {
          request: {
            studentId: request.studentId,
            juzId: request.juzId,
            batch: request.batch,
            stage: MunaqasyahStage.TASMI,
          },
        },
        include: {
          tasmiScore: true,
        },
      });

      // Create final result if both stages are completed
      if (tasmiResult && tasmiResult.tasmiScore) {
        const finalScore = tasmiResult.tasmiScore.totalScore * 0.6 + score * 0.4;
        let finalGrade: MunaqasyahGrade = MunaqasyahGrade.TIDAK_LULUS;

        if (finalScore >= 91) finalGrade = MunaqasyahGrade.MUMTAZ;
        else if (finalScore >= 85) finalGrade = MunaqasyahGrade.JAYYID_JIDDAN;
        else if (finalScore >= 80) finalGrade = MunaqasyahGrade.JAYYID;

        await prisma.munaqasyahFinalResult.create({
          data: {
            studentId: request.studentId,
            groupId: request.groupId,
            juzId: request.juzId,
            batch: request.batch,
            tasmiResultId: tasmiResult.id,
            munaqasyahResultId: result.id,
            finalScore,
            finalGrade,
            passed: finalScore >= 80,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Hasil Munaqasyah berhasil disimpan',
        data: result,
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Data nilai tidak valid untuk stage yang dipilih' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[POST_TEACHER_MUNAQASYAH_RESULT]', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Gagal menyimpan hasil',
      },
      { status: 500 }
    );
  }
}
