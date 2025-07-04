import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role, Semester, TashihRequestStatus, TashihType } from '@prisma/client';

type Params = Promise<{ period: string }>;

type ChartLegend = 'SELESAI' | 'SEDANG_DIJALANI' | 'BELUM_DIMULAI';

interface TahfidzProgress {
  juzId: number;
  juzName: string;
  completedSurah: number;
  totalSurah: number;
  percent: number;
  status: ChartLegend;
}

interface StudentTahfidzResponse {
  studentId: string;
  studentName: string;
  lastSurah: string;
  currentJuz: number | null;
  progress: TahfidzProgress[];
}

export async function GET(req: Request, segmentData: { params: Params }) {
  try {
    const { period } = await segmentData.params;

    const [year, smstr] = period.split('-');
    const academicYear = decodeURIComponent(year);
    const semester = Object.values(Semester).includes(smstr as Semester)
      ? (smstr as Semester)
      : null;

    if (!semester) {
      return NextResponse.json(
        { success: false, error: `Invalid semester: ${smstr}` },
        { status: 400 }
      );
    }

    const session = await auth();
    if (!session?.user || session.user.role !== Role.student) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const student = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: true,
        group: {
          include: {
            classroom: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student profile tidak ditemukan' },
        { status: 404 }
      );
    }

    const allJuz = await prisma.juz.findMany({
      include: {
        surahJuz: {
          include: {
            surah: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    const surahCountMap = Object.fromEntries(allJuz.map((juz) => [juz.id, juz.surahJuz.length]));

    const tashihRequests = await prisma.tashihRequest.findMany({
      where: {
        studentId: student.id,
        tashihType: TashihType.ALQURAN,
        status: TashihRequestStatus.SELESAI,
        juzId: { in: allJuz.map((j) => j.id) },
        group: {
          classroom: {
            OR: [
              {
                academicYear: { lt: academicYear },
              },
              {
                academicYear,
                semester:
                  semester === Semester.GENAP
                    ? { in: [Semester.GANJIL, Semester.GENAP] }
                    : Semester.GANJIL,
              },
            ],
          },
        },
      },
      include: {
        juz: true,
        surah: {
          include: {
            surahJuz: true,
          },
        },
        group: {
          include: {
            classroom: true,
          },
        },
      },
      orderBy: [{ juzId: 'asc' }, { surah: { id: 'asc' } }],
    });

    const progressList: TahfidzProgress[] = [];
    let currentJuz: number | null = null;
    let lastSurah = 'Belum ada hafalan';

    let highestJuzWithProgress = 0;
    let lastCompletedSurah: string | null = null;

    for (const juz of allJuz) {
      const juzRequests = tashihRequests.filter((req) => req.juzId === juz.id);
      const completedSurah = juzRequests.length;
      const totalSurah = surahCountMap[juz.id] || 0;

      let status: ChartLegend = 'BELUM_DIMULAI';
      let percent = 0;

      if (completedSurah > 0) {
        percent = totalSurah > 0 ? (completedSurah / totalSurah) * 100 : 0;

        if (completedSurah >= totalSurah) {
          status = 'SELESAI';
          highestJuzWithProgress = juz.id;
        } else {
          status = 'SEDANG_DIJALANI';
          currentJuz = juz.id;
          highestJuzWithProgress = juz.id;
        }

        if (juzRequests.length > 0) {
          const sortedRequests = juzRequests.sort((a, b) => {
            if (a.surah && b.surah) {
              return a.surah.id - b.surah.id;
            }
            return 0;
          });
          const lastRequest = sortedRequests[sortedRequests.length - 1];
          if (lastRequest?.surah && juz.id >= highestJuzWithProgress) {
            lastCompletedSurah = lastRequest.surah.name;
          }
        }
      }

      progressList.push({
        juzId: juz.id,
        juzName: juz.name,
        completedSurah,
        totalSurah,
        percent: Math.round(percent * 100) / 100,
        status,
      });
    }

    if (lastCompletedSurah) {
      lastSurah = lastCompletedSurah;
    }

    const result: StudentTahfidzResponse = {
      studentId: student.id,
      studentName: student.user.fullName,
      lastSurah,
      currentJuz,
      progress: progressList,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching student tahfidz progress:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
