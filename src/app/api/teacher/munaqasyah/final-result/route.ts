import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.teacher) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const finalResults = await prisma.munaqasyahFinalResult.findMany({
      orderBy: { createdAt: 'desc' },
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

    const formatted = finalResults.map((fr) => ({
      id: fr.id,
      finalScore: fr.finalScore,
      finalGrade: fr.finalGrade,
      passed: fr.passed,
      batch: fr.batch,
      juz: fr.juz,
      student: fr.student,
      academicYear: fr.group.classroom.academicYear,
      semester: fr.group.classroom.semester,
      classroomName: fr.group.classroom.name,
      groupName: fr.group.name,
      createdAt: fr.createdAt.toISOString(),
      tasmiResult: {
        score: fr.tasmiResult.tasmiScore?.totalScore || 0,
        grade: fr.tasmiResult.grade,
        passed: fr.tasmiResult.passed,
        schedule: fr.tasmiResult.schedule,
        scoreDetails: fr.tasmiResult.tasmiScore,
      },
      munaqasyahResult: {
        score: fr.munaqasyahResult.munaqasyahScore?.totalScore || 0,
        grade: fr.munaqasyahResult.grade,
        passed: fr.munaqasyahResult.passed,
        schedule: fr.munaqasyahResult.schedule,
        scoreDetails: fr.munaqasyahResult.munaqasyahScore,
      },
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error('[GET_MUNAQASYAH_FINAL_RESULT]', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data hasil final munaqasyah' },
      { status: 500 }
    );
  }
}
