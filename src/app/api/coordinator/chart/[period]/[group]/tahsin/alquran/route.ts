import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role, SubmissionStatus, SubmissionType, Semester } from '@prisma/client';

type Params = Promise<{ period: string; group: string }>;

interface StudentData {
  id: string;
  user: {
    fullName: string;
  };
}

interface AlquranProgress {
  juzId: number;
  juzName: string;
  completedAyah: number;
  totalAyah: number;
  percent: number;
  status: 'SELESAI' | 'SEDANG_DIJALANI' | 'BELUM_DIMULAI';
}

interface ChartResponseItem {
  studentId: string;
  studentName: string;
  lastJuz: string;
  currentJuz: number | null;
  progress: AlquranProgress[];
}

export async function GET(req: Request, segmentData: { params: Params }) {
  try {
    const params = await segmentData.params;
    const { period, group } = params;

    let academicYear: string | null = null;
    let semester: Semester | null = null;

    if (period && period !== 'all') {
      const [encodedYear, sem] = period.split('-');
      academicYear = decodeURIComponent(encodedYear);
      if (Object.values(Semester).includes(sem as Semester)) {
        semester = sem as Semester;
      } else {
        return NextResponse.json(
          { success: false, error: `Invalid semester: ${sem}` },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Period parameter is required' },
        { status: 400 }
      );
    }

    const groupId = group === 'all' ? null : group;

    console.log('Tahsin Alquran API Dynamic Params:', {
      period,
      group,
      parsed: { academicYear, semester, groupId },
    });

    const session = await auth();

    if (!session?.user || session.user.role !== Role.coordinator) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const coordinator = await prisma.coordinatorProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!coordinator) {
      return NextResponse.json({ success: false, error: 'Koordinator tidak ditemukan' }, { status: 404 });
    }

    console.log('Coordinator found:', coordinator.id);

    let students: StudentData[] = [];

    console.log('Fetching tahsin alquran data for specific period:', { academicYear, semester });

    const groupHistories = await prisma.groupHistory.findMany({
      where: {
        academicYear,
        semester,
        ...(groupId && { groupId }),
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    const activeGroups = await prisma.group.findMany({
      include: {
        students: {
          include: {
            user: true,
          },
        },
        classroom: true,
      },
      where: {
        classroom: {
          academicYear,
          semester,
        },
        ...(groupId && { id: groupId }),
      },
    });

    const historicalStudents = groupHistories.map((gh) => gh.student);
    const activeStudents = activeGroups.flatMap((group) => group.students);

    const allStudents = [...historicalStudents, ...activeStudents];
    const uniqueStudents = allStudents.reduce((acc, student) => {
      if (!acc.find((s) => s.id === student.id)) {
        acc.push(student);
      }
      return acc;
    }, [] as StudentData[]);

    students = uniqueStudents;

    console.log('Students found:', students.length);

    const alquranSubmissions = await prisma.submission.findMany({
      where: {
        studentId: { in: students.map((s) => s.id) },
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
      uniqueStudents: new Set(alquranSubmissions.map((s) => s.studentId)).size,
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

    const result: ChartResponseItem[] = [];

    for (const student of students) {
      const studentSubmissions = alquranSubmissions.filter((s) => s.studentId === student.id);

      const progressList: AlquranProgress[] = [];
      let currentJuz: number | null = null;
      let lastJuz = 'Belum ada';

      for (const juz of allJuz) {
        const surahIdsInJuz = juz.surahJuz.map((sj) => sj.surahId);
        const juzSubmissions = studentSubmissions.filter(
          (s) => s.surahId && surahIdsInJuz.includes(s.surahId)
        );

        const totalAyah = juz.surahJuz.reduce((total, sj) => {
          const ayatInJuz = sj.endVerse - sj.startVerse + 1;
          return total + ayatInJuz;
        }, 0);

        const completedAyah = juzSubmissions.reduce((total, submission) => {
          if (submission.surah && submission.startVerse && submission.endVerse) {
            const surahJuzInfo = juz.surahJuz.find(sj => sj.surahId === submission.surahId);
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

        let status: 'SELESAI' | 'SEDANG_DIJALANI' | 'BELUM_DIMULAI' = 'BELUM_DIMULAI';
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

      result.push({
        studentId: student.id,
        studentName: student.user.fullName,
        lastJuz,
        currentJuz,
        progress: progressList,
      });
    }

    console.log('Final tahsin alquran result count:', result.length);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching tahsin alquran chart data:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}