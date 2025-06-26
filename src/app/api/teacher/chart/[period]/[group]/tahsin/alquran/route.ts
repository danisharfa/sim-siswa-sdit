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

    // Parse period jika format "2024-1" atau handle "all"
    let academicYear: string | null = null;
    let semester: Semester | null = null;

    if (period && period !== 'all') {
      const [encodedYear, sem] = period.split('-');
      academicYear = decodeURIComponent(encodedYear);
      // ✅ Validasi dan konversi ke enum Semester
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

    if (!session?.user || session.user.role !== Role.teacher) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json({ success: false, error: 'Guru tidak ditemukan' }, { status: 404 });
    }

    console.log('Teacher found:', teacher.id);

    let students: StudentData[] = [];

    if (academicYear && semester) {
      // Jika periode spesifik dipilih, ambil dari kombinasi GroupHistory dan data aktif
      console.log('Fetching tahsin alquran data for specific period:', { academicYear, semester });

      // 1. Ambil dari GroupHistory untuk periode historis
      const groupHistoryFilter: Record<string, string> = {
        teacherId: teacher.id,
        academicYear,
        semester,
      };

      if (groupId) {
        groupHistoryFilter.groupId = groupId;
      }

      const groupHistories = await prisma.groupHistory.findMany({
        where: groupHistoryFilter,
        include: {
          student: {
            include: {
              user: true,
            },
          },
        },
      });

      // 2. Ambil dari data aktif (tanpa filter periode classroom)
      const activeGroupFilter: Record<string, string> = {
        teacherId: teacher.id,
      };

      if (groupId) {
        activeGroupFilter.groupId = groupId;
      }

      const activeGroups = await prisma.teacherGroup.findMany({
        where: activeGroupFilter,
        include: {
          group: {
            include: {
              classroom: true,
              students: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      // Gabungkan siswa dari historis dan aktif
      const studentsFromHistory = groupHistories.map((gh) => gh.student);
      const studentsFromActive = activeGroups.flatMap((ag) => ag.group.students);

      // Gabungkan dan deduplikasi berdasarkan ID
      const allStudents = [...studentsFromHistory, ...studentsFromActive];
      const uniqueStudents = allStudents.reduce((acc, student) => {
        if (!acc.find((s) => s.id === student.id)) {
          acc.push(student);
        }
        return acc;
      }, [] as StudentData[]);

      students = uniqueStudents;
    } else {
      // Jika "all" dipilih, ambil semua siswa dari TeacherGroup yang aktif
      console.log('Fetching all tahsin alquran data');

      const teacherGroupFilter: Record<string, string> = {
        teacherId: teacher.id,
      };

      if (groupId) {
        teacherGroupFilter.groupId = groupId;
      }

      const teacherGroups = await prisma.teacherGroup.findMany({
        where: teacherGroupFilter,
        include: {
          group: {
            include: {
              students: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      students = teacherGroups.flatMap((tg) => tg.group.students);
    }

    console.log('Students found:', students.length);

    // Dapatkan semua submission alquran yang sudah lulus (kumulatif sampai periode yang dipilih)
    const alquranSubmissions = await prisma.submission.findMany({
      where: {
        studentId: { in: students.map((s) => s.id) },
        submissionType: SubmissionType.TAHSIN_ALQURAN,
        submissionStatus: SubmissionStatus.LULUS,
        // ✅ Filter kumulatif: ambil semua data sampai periode yang dipilih
        group: {
          classroom: {
            OR: [
              {
                // Periode sebelum tahun yang dipilih
                academicYear: { lt: academicYear },
              },
              {
                // Tahun yang sama, tapi semester sebelumnya atau sama
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

    // Ambil semua juz untuk referensi
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

      // Hitung progress untuk setiap juz
      const progressList: AlquranProgress[] = [];
      let currentJuz: number | null = null;
      let lastJuz = 'Belum ada';

      // Cari juz terakhir yang diselesaikan (berdasarkan completion status)
      for (const juz of allJuz) {
        const surahIdsInJuz = juz.surahJuz.map((sj) => sj.surahId);
        const juzSubmissions = studentSubmissions.filter(
          (s) => s.surahId && surahIdsInJuz.includes(s.surahId)
        );

        // Hitung total ayat dalam juz
        const totalAyah = juz.surahJuz.reduce((total, sj) => total + (sj.surah.verseCount || 0), 0);

        // Hitung ayat yang sudah diselesaikan
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
            // Update lastJuz jika juz ini selesai
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
