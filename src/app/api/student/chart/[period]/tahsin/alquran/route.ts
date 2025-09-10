import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role, SubmissionStatus, SubmissionType, Semester } from '@prisma/client';

type Params = Promise<{ period: string }>;

type ChartLegend = 'SELESAI' | 'SEDANG_DIJALANI' | 'BELUM_DIMULAI';

interface AlquranProgress {
  juzId: number;
  juzName: string;
  completedAyah: number;
  totalAyah: number;
  percent: number;
  status: ChartLegend;
}

interface StudentTahsinAlquranResponse {
  studentId: string;
  studentName: string;
  lastJuz: string;
  currentJuz: number | null;
  progress: AlquranProgress[];
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

    const alquranSubmissions = await prisma.submission.findMany({
      where: {
        studentId: student.userId,
        submissionType: SubmissionType.TAHSIN_ALQURAN,
        submissionStatus: SubmissionStatus.LULUS,
        group: {
          classroom: {
            OR: [
              {
                academicYear: { lt: academicYear },
              },
              {
                academicYear,
                semester: semester === 'GENAP' ? { in: ['GANJIL', 'GENAP'] } : 'GANJIL',
              },
            ],
          },
        },
      },
      include: {
        surah: true,
        group: {
          include: {
            classroom: true,
          },
        },
      },
    });

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

    const progressList: AlquranProgress[] = [];
    let currentJuz: number | null = null;
    let lastJuz = 'Belum ada';

    for (const juz of allJuz) {
      const surahIdsInJuz = juz.surahJuz.map((sj) => sj.surahId);
      const juzSubmissions = alquranSubmissions.filter(
        (s) => s.surahId && surahIdsInJuz.includes(s.surahId)
      );

      const totalAyah = juz.surahJuz.reduce((total, sj) => {
        const ayatInJuz = sj.endVerse - sj.startVerse + 1;
        return total + ayatInJuz;
      }, 0);

      const completedAyah = juzSubmissions.reduce((total, submission) => {
        if (submission.surah && submission.startVerse && submission.endVerse) {
          const surahJuzInfo = juz.surahJuz.find((sj) => sj.surahId === submission.surahId);
          if (surahJuzInfo) {
            const juzStart = surahJuzInfo.startVerse;
            const juzEnd = surahJuzInfo.endVerse;
            const submissionStart = submission.startVerse;
            const submissionEnd = submission.endVerse;

            const overlapStart = Math.max(juzStart, submissionStart);
            const overlapEnd = Math.min(juzEnd, submissionEnd);

            if (overlapStart <= overlapEnd) {
              const overlapAyat = overlapEnd - overlapStart + 1;
              return total + overlapAyat;
            }
          }
        }
        return total;
      }, 0);

      let status: ChartLegend = 'BELUM_DIMULAI';
      let percent = 0;

      if (completedAyah > 0) {
        percent = totalAyah ? (completedAyah / totalAyah) * 100 : 0;

        if (completedAyah >= totalAyah) {
          status = 'SELESAI';
          lastJuz = `Juz ${juz.id}`;
        } else {
          status = 'SEDANG_DIJALANI';
          currentJuz = juz.id;
        }
      }

      progressList.push({
        juzId: juz.id,
        juzName: `Juz ${juz.id}`,
        completedAyah,
        totalAyah,
        percent: Math.round(percent * 100) / 100,
        status,
      });
    }

    const result: StudentTahsinAlquranResponse = {
      studentId: student.userId,
      studentName: student.user.fullName,
      lastJuz,
      currentJuz,
      progress: progressList,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching student tahsin alquran progress:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
