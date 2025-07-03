import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role } from '@prisma/client';

export async function fetchMunaqasyahFinalResult() {
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

    const finalResults = await prisma.munaqasyahFinalResult.findMany({
      orderBy: { createdAt: 'desc' },
      where: {
        studentId: student.id,
      },
      include: {
        juz: { select: { name: true } },
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
                examiner: {
                  select: {
                    user: { select: { fullName: true } },
                  },
                },
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
                examiner: {
                  select: {
                    user: { select: { fullName: true } },
                  },
                },
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
        },
      },
    });

    return finalResults.map((fr) => ({
      id: fr.id,
      finalScore: fr.finalScore,
      finalGrade: fr.finalGrade,
      passed: fr.passed,
      batch: fr.batch,
      juz: fr.juz,
      academicYear: fr.group.classroom.academicYear,
      semester: fr.group.classroom.semester,
      classroomName: fr.group.classroom.name,
      groupName: fr.group.name,
      createdAt: fr.createdAt.toISOString(),
      tasmiResult: {
        score: fr.tasmiResult.tasmiScore?.totalScore || 0,
        grade: fr.tasmiResult.grade,
        passed: fr.tasmiResult.passed,
        schedule: {
          ...fr.tasmiResult.schedule,
          date: fr.tasmiResult.schedule.date.toISOString(),
        },
        scoreDetails: fr.tasmiResult.tasmiScore,
      },
      munaqasyahResult: {
        score: fr.munaqasyahResult.munaqasyahScore?.totalScore || 0,
        grade: fr.munaqasyahResult.grade,
        passed: fr.munaqasyahResult.passed,
        schedule: {
          ...fr.munaqasyahResult.schedule,
          date: fr.munaqasyahResult.schedule.date.toISOString(),
        },
        scoreDetails: fr.munaqasyahResult.munaqasyahScore,
      },
    }));
  } catch (error) {
    console.error('[FETCH_MUNAQASYAH_FINAL_RESULT]', error);
    throw new Error('Gagal mengambil data hasil final munaqasyah');
  }
}
