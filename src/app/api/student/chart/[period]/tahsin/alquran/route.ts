import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role, SubmissionStatus, SubmissionType, Semester } from '@prisma/client';

type Params = Promise<{ period: string }>;

interface AlquranProgress {
  juzId: number;
  juzName: string;
  completedAyah: number;
  totalAyah: number;
  percent: number;
  status: 'SELESAI' | 'SEDANG_DIJALANI' | 'BELUM_DIMULAI';
}

interface StudentTahsinAlquranResponse {
  studentId: string;
  studentName: string;
  currentPeriod: string;
  currentGroup: {
    id: string;
    name: string;
    className: string;
  } | null;
  lastJuz: string;
  currentJuz: number | null;
  totalProgress: {
    completedJuz: number;
    totalJuz: number;
    overallPercent: number;
  };
  progress: AlquranProgress[];
}

export async function GET(req: Request, segmentData: { params: Params }) {
  try {
    const params = await segmentData.params;
    const { period } = params;

    let academicYear: string | null = null;
    let semester: Semester | null = null;

    if (period && period !== 'all') {
      const [year, smstr] = period.split('-');
      academicYear = decodeURIComponent(year);
      if (Object.values(Semester).includes(smstr as Semester)) {
        semester = smstr as Semester;
      } else {
        return NextResponse.json(
          { success: false, error: `Invalid semester: ${smstr}` },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Period parameter is required' },
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

    console.log('Fetching tahsin alquran progress for student:', {
      studentId: student.id,
      studentName: student.user.fullName,
      academicYear,
      semester,
    });

    // Get current group for the period
    let currentGroup = null;

    if (
      student.group &&
      student.group.classroom.academicYear === academicYear &&
      student.group.classroom.semester === semester
    ) {
      currentGroup = {
        id: student.group.id,
        name: student.group.name,
        className: student.group.classroom.name,
      };
    } else {
      const groupHistory = await prisma.groupHistory.findFirst({
        where: {
          studentId: student.id,
          academicYear,
          semester,
        },
        include: {
          group: {
            include: {
              classroom: true,
            },
          },
        },
      });

      if (groupHistory) {
        currentGroup = {
          id: groupHistory.group.id,
          name: groupHistory.group.name,
          className: groupHistory.group.classroom.name,
        };
      }
    }

    // Get cumulative submissions (all passed submissions up to the selected period)
    const alquranSubmissions = await prisma.submission.findMany({
      where: {
        studentId: student.id,
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

    console.log('Alquran submissions found for cumulative period:', {
      academicYear,
      semester,
      submissionCount: alquranSubmissions.length,
    });

    // Get all juz for reference
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

    // Calculate progress for each juz
    const progressList: AlquranProgress[] = [];
    let currentJuz: number | null = null;
    let lastJuz = 'Belum ada';
    let completedJuzCount = 0;

    for (const juz of allJuz) {
      const surahIdsInJuz = juz.surahJuz.map((sj) => sj.surahId);
      const juzSubmissions = alquranSubmissions.filter(
        (s) => s.surahId && surahIdsInJuz.includes(s.surahId)
      );

      // Calculate total ayat in juz
      const totalAyah = juz.surahJuz.reduce((total, sj) => total + (sj.surah.verseCount || 0), 0);

      // Calculate completed ayat
      const completedAyah = juzSubmissions.reduce((total, submission) => {
        if (submission.surah) {
          return total + (submission.surah.verseCount || 0);
        }
        return total;
      }, 0);

      let status: 'SELESAI' | 'SEDANG_DIJALANI' | 'BELUM_DIMULAI' = 'BELUM_DIMULAI';
      let percent = 0;

      if (completedAyah > 0) {
        percent = totalAyah ? (completedAyah / totalAyah) * 100 : 0;

        if (completedAyah >= totalAyah) {
          status = 'SELESAI';
          lastJuz = `Juz ${juz.id}`;
          completedJuzCount++;
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

    const totalJuz = allJuz.length;
    const overallPercent =
      totalJuz > 0 ? Math.round((completedJuzCount / totalJuz) * 100 * 100) / 100 : 0;

    const result: StudentTahsinAlquranResponse = {
      studentId: student.id,
      studentName: student.user.fullName,
      currentPeriod: `${academicYear} ${semester === 'GANJIL' ? 'Ganjil' : 'Genap'}${
        currentGroup ? ` | ${currentGroup.name} - ${currentGroup.className}` : ''
      }`,
      currentGroup,
      lastJuz,
      currentJuz,
      totalProgress: {
        completedJuz: completedJuzCount,
        totalJuz,
        overallPercent,
      },
      progress: progressList,
    };

    console.log('Student tahsin alquran progress result:', {
      studentName: result.studentName,
      period: result.currentPeriod,
      completedJuz: result.totalProgress.completedJuz,
      overallPercent: result.totalProgress.overallPercent,
      lastJuz: result.lastJuz,
      currentJuz: result.currentJuz,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching student tahsin alquran progress:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
