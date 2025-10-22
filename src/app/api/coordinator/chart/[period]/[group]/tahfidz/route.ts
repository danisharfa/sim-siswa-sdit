import { ChartLegend } from '@/components/ui/chart';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role, Semester, TashihRequestStatus, TashihType } from '@prisma/client';

type Params = Promise<{ period: string; group: string }>;

interface StudentData {
  userId: string;
  user: {
    fullName: string;
  };
}

type ChartLegend = 'SELESAI' | 'SEDANG_DIJALANI' | 'BELUM_DIMULAI';

interface TahfidzProgress {
  juzId: number;
  juzName: string;
  completedSurah: number;
  totalSurah: number;
  percent: number;
  status: ChartLegend;
}

interface ChartResponseItem {
  studentId: string;
  studentName: string;
  lastSurah: string;
  currentJuz: number | null;
  progress: TahfidzProgress[];
}

export async function GET(req: Request, segmentData: { params: Params }) {
  try {
    const params = await segmentData.params;
    const { period, group } = params;

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

    const groupId = group === 'all' ? null : group;

    const session = await auth();
    if (!session?.user || session.user.role !== Role.coordinator) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const coordinator = await prisma.coordinatorProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!coordinator) {
      return NextResponse.json(
        { success: false, error: 'Koordinator tidak ditemukan' },
        { status: 404 }
      );
    }

    let students: StudentData[] = [];

    // console.log('Fetching data for specific period:', { academicYear, semester });

    // Ambil siswa dari GroupHistory untuk periode spesifik
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

    // Ambil siswa dari grup aktif yang sesuai dengan periode
    const activeGroupsQuery = {
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
    };

    const activeGroups = await prisma.group.findMany(activeGroupsQuery);

    // Kombinasikan siswa dari historical dan active
    const historicalStudents = groupHistories.map((gh) => gh.student);
    const activeStudents = activeGroups.flatMap((group) => group.students);

    const allStudents = [...historicalStudents, ...activeStudents];
    const uniqueStudents = allStudents.reduce((acc, student) => {
      if (!acc.find((s) => s.userId === student.userId)) {
        acc.push(student);
      }
      return acc;
    }, [] as StudentData[]);

    students = uniqueStudents;

    // console.log('Students found for period:', {
    //   totalStudents: students.length,
    //   fromHistory: groupHistories.length,
    //   fromActiveGroups: activeGroups.length,
    //   studentIds: students.map((s) => s.userId),
    // });

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
        studentId: { in: students.map((s) => s.userId) },
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
                semester: semester === 'GENAP' ? { in: ['GANJIL', 'GENAP'] } : 'GANJIL',
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
    });

    // console.log('Tahfidz requests found for cumulative period:', {
    //   academicYear,
    //   semester,
    //   requestCount: tashihRequests.length,
    //   uniqueStudents: new Set(tashihRequests.map((r) => r.studentId)).size,
    //   requestDetails: tashihRequests.slice(0, 5).map((r) => ({
    //     studentId: r.studentId,
    //     surahName: r.surah?.name,
    //     juzId: r.juzId,
    //     classroomPeriod: `${r.group.classroom.academicYear}-${r.group.classroom.semester}`,
    //   })),
    // });

    const result: ChartResponseItem[] = [];

    for (const student of students) {
      const studentRequests = tashihRequests.filter((req) => req.studentId === student.userId);
      const progressList: TahfidzProgress[] = [];
      let currentJuz: number | null = null;
      let lastSurah = 'Belum ada';

      // Cari surah terakhir dari juz yang tertinggi yang sedang dikerjakan
      let highestJuzWithProgress = 0;

      for (const juz of allJuz) {
        const juzRequests = studentRequests.filter((req) => req.juzId === juz.id);
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

          // Update lastSurah dari juz tertinggi yang ada progressnya
          if (juz.id >= highestJuzWithProgress && juzRequests.length > 0) {
            const lastRequestInJuz = juzRequests[juzRequests.length - 1];
            if (lastRequestInJuz?.surah) {
              lastSurah = lastRequestInJuz.surah.name;
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

      result.push({
        studentId: student.userId,
        studentName: student.user.fullName,
        lastSurah,
        currentJuz,
        progress: progressList,
      });
    }

    // console.log('Final result count:', result.length);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching chart data:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
