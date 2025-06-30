import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role, TashihRequestStatus, TashihType, Semester } from '@prisma/client';

type Params = Promise<{ period: string }>;

interface WafaProgress {
  wafaId: number;
  wafaName: string;
  completedPages: number;
  totalPages: number | null;
  percent: number;
  status: 'SELESAI' | 'SEDANG_DIJALANI' | 'BELUM_DIMULAI';
}

interface StudentTahsinWafaResponse {
  studentId: string;
  studentName: string;
  currentPeriod: string;
  currentGroup: {
    id: string;
    name: string;
    className: string;
  } | null;
  currentWafa: number | null;
  lastWafa: string;
  totalProgress: {
    completedBooks: number;
    totalBooks: number;
    overallPercent: number;
  };
  progress: WafaProgress[];
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

    console.log('Fetching tahsin wafa progress for student:', {
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

    // Get cumulative wafa requests (all completed requests up to the selected period)
    const wafaRequests = await prisma.tashihRequest.findMany({
      where: {
        studentId: student.id,
        tashihType: TashihType.WAFA,
        status: TashihRequestStatus.SELESAI,
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
    });

    // Get all wafa books for reference
    const wafaBooks = await prisma.wafa.findMany({
      orderBy: { id: 'asc' },
    });

    // Calculate progress for each wafa book
    const progressList: WafaProgress[] = [];
    let currentWafa: number | null = null;
    let lastWafa = 'Belum ada';
    let completedBooksCount = 0;

    for (const wafaBook of wafaBooks) {
      const wafaBookRequests = wafaRequests.filter((r) => r.wafaId === wafaBook.id);

      // Calculate total completed pages based on page ranges
      const completedPages = wafaBookRequests.reduce((total, request) => {
        if (request.startPage && request.endPage) {
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
          lastWafa = wafaBook.name;
          completedBooksCount++;
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

    const totalBooks = wafaBooks.length;
    const overallPercent =
      totalBooks > 0 ? Math.round((completedBooksCount / totalBooks) * 100 * 100) / 100 : 0;

    const result: StudentTahsinWafaResponse = {
      studentId: student.id,
      studentName: student.user.fullName,
      currentPeriod: `${academicYear} ${semester === 'GANJIL' ? 'Ganjil' : 'Genap'}${
        currentGroup ? ` | ${currentGroup.name} - ${currentGroup.className}` : ''
      }`,
      currentGroup,
      currentWafa,
      lastWafa,
      totalProgress: {
        completedBooks: completedBooksCount,
        totalBooks,
        overallPercent,
      },
      progress: progressList,
    };

    console.log('Student tahsin wafa progress result:', {
      studentName: result.studentName,
      period: result.currentPeriod,
      completedBooks: result.totalProgress.completedBooks,
      overallPercent: result.totalProgress.overallPercent,
      lastWafa: result.lastWafa,
      currentWafa: result.currentWafa,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching student tahsin wafa progress:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
