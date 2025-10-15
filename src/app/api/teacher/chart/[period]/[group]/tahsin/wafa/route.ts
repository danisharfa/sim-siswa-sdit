import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role, TashihRequestStatus, TashihType, Semester } from '@prisma/client';

type Params = Promise<{ period: string; group: string }>;

interface StudentData {
  userId: string;
  user: {
    fullName: string;
  };
}

interface WafaProgress {
  wafaId: number;
  wafaName: string;
  completedPages: number;
  totalPages: number | null;
  percent: number;
  status: 'SELESAI' | 'SEDANG_DIJALANI' | 'BELUM_DIMULAI';
}

interface ChartResponseItem {
  studentId: string;
  studentName: string;
  currentWafa: number | null;
  lastWafa: string;
  progress: WafaProgress[];
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

    console.log('Teacher found:', teacher.userId);

    let students: StudentData[] = [];

    if (academicYear && semester) {
      // Jika periode spesifik dipilih, ambil dari kombinasi GroupHistory dan data aktif
      console.log('Fetching wafa data for specific period:', { academicYear, semester });

      // 1. Ambil dari GroupHistory untuk periode historis
      const groupHistoryFilter: Record<string, string> = {
        teacherId: teacher.userId,
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
        teacherId: teacher.userId,
      };

      if (groupId) {
        activeGroupFilter.id = groupId;
      }

      const activeGroups = await prisma.group.findMany({
        where: {
          teacherId: teacher.userId,
          ...activeGroupFilter,
        },
        include: {
          classroom: true,
          students: {
            include: {
              user: true,
            },
          },
        },
      });

      // Gabungkan siswa dari historis dan aktif
      const studentsFromHistory = groupHistories.map((gh) => gh.student);
      const studentsFromActive = activeGroups.flatMap((group) => group.students);

      // Gabungkan dan deduplikasi berdasarkan ID
      const allStudents = [...studentsFromHistory, ...studentsFromActive];
      const uniqueStudents = allStudents.reduce((acc, student) => {
        if (!acc.find((s) => s.userId === student.userId)) {
          acc.push(student);
        }
        return acc;
      }, [] as StudentData[]);

      students = uniqueStudents;
    } else {
      // Jika "all" dipilih, ambil semua siswa dari Group yang aktif
      console.log('Fetching all wafa data');

      const teacherGroupFilter: Record<string, string> = {
        teacherId: teacher.userId,
      };

      if (groupId) {
        teacherGroupFilter.id = groupId;
      }

      const groups = await prisma.group.findMany({
        where: {
          ...teacherGroupFilter,
        },
        include: {
          students: {
            include: {
              user: true,
            },
          },
        },
      });

      students = groups.flatMap((group) => group.students);
    }

    console.log('Students found:', students.length);

    // Dapatkan semua request wafa yang sudah selesai (kumulatif sampai periode yang dipilih)
    const wafaRequests = await prisma.tashihRequest.findMany({
      where: {
        studentId: { in: students.map((s) => s.userId) },
        tashihType: TashihType.WAFA,
        status: TashihRequestStatus.SELESAI,
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
        wafa: true,
        group: {
          include: {
            classroom: true,
          },
        },
      },
    });

    console.log('Wafa requests found for cumulative period:', {
      academicYear,
      semester,
      requestCount: wafaRequests.length,
      uniqueStudents: new Set(wafaRequests.map((r) => r.studentId)).size,
      sampleRequests: wafaRequests.slice(0, 3).map((r) => ({
        studentId: r.studentId,
        wafaId: r.wafaId,
        wafaName: r.wafa?.name,
        startPage: r.startPage,
        endPage: r.endPage,
        pagesInRange: r.startPage && r.endPage ? r.endPage - r.startPage + 1 : 0,
      })),
    });

    // Ambil semua buku wafa untuk referensi
    const wafaBooks = await prisma.wafa.findMany({
      orderBy: { id: 'asc' },
    });

    const result: ChartResponseItem[] = [];

    for (const student of students) {
      const studentRequests = wafaRequests.filter((r) => r.studentId === student.userId);

      // Hitung progress untuk setiap wafa
      const progressList: WafaProgress[] = [];
      let currentWafa: number | null = null;
      let lastWafa = 'Belum ada';

      // Debug log untuk siswa pertama saja
      if (studentRequests.length > 0 && result.length === 0) {
        console.log(
          `Sample student ${student.user.fullName} wafa requests:`,
          studentRequests.map((r) => ({
            wafaId: r.wafaId,
            wafaName: r.wafa?.name,
            startPage: r.startPage,
            endPage: r.endPage,
            pagesInRange: r.startPage && r.endPage ? r.endPage - r.startPage + 1 : 0,
          }))
        );
      }

      for (const wafaBook of wafaBooks) {
        const wafaBookRequests = studentRequests.filter((r) => r.wafaId === wafaBook.id);

        // Hitung total halaman yang sudah ditashih berdasarkan range
        const completedPages = wafaBookRequests.reduce((total, request) => {
          if (request.startPage && request.endPage) {
            // Hitung jumlah halaman dalam range (inclusive)
            const pagesInRange = request.endPage - request.startPage + 1;
            return total + pagesInRange;
          }
          return total;
        }, 0);

        const totalPages = wafaBook.pageCount;

        let status: 'SELESAI' | 'SEDANG_DIJALANI' | 'BELUM_DIMULAI' = 'BELUM_DIMULAI';
        let percent = 0;

        if (completedPages > 0) {
          percent = totalPages ? (completedPages / totalPages) * 100 : 0;

          if (completedPages >= (totalPages || 0)) {
            status = 'SELESAI';
            // Update lastWafa jika wafa ini selesai
            lastWafa = wafaBook.name;
          } else {
            status = 'SEDANG_DIJALANI';
            currentWafa = wafaBook.id;
          }
        }

        progressList.push({
          wafaId: wafaBook.id,
          wafaName: wafaBook.name,
          completedPages,
          totalPages,
          percent: Math.round(percent * 100) / 100,
          status,
        });
      }

      result.push({
        studentId: student.userId,
        studentName: student.user.fullName,
        currentWafa,
        lastWafa,
        progress: progressList,
      });
    }

    console.log('Final wafa result count:', result.length);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching wafa chart data:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
