import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role, TashihRequestStatus, TashihType, Semester } from '@prisma/client';

type Params = Promise<{ period: string }>;

type ChartLegend = 'SELESAI' | 'SEDANG_DIJALANI' | 'BELUM_DIMULAI';

interface WafaProgress {
  wafaId: number;
  wafaName: string;
  completedPages: number;
  totalPages: number | null;
  percent: number;
  status: ChartLegend;
}

interface StudentTahsinWafaResponse {
  studentId: string;
  studentName: string;
  currentWafa: number | null;
  lastWafa: string;
  progress: WafaProgress[];
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

    const wafaRequests = await prisma.tashihRequest.findMany({
      where: {
        studentId: student.userId,
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
    const wafaBooks = await prisma.wafa.findMany({
      orderBy: { id: 'asc' },
    });

    const progressList: WafaProgress[] = [];
    let currentWafa: number | null = null;
    let lastWafa = 'Belum ada';

    for (const wafaBook of wafaBooks) {
      const wafaBookRequests = wafaRequests.filter((r) => r.wafaId === wafaBook.id);

      const completedPages = wafaBookRequests.reduce((total, request) => {
        if (request.startPage && request.endPage) {
          const pagesInRange = request.endPage - request.startPage + 1;
          return total + pagesInRange;
        }
        return total;
      }, 0);

      const totalPages = wafaBook.pageCount;

      let status: ChartLegend = 'BELUM_DIMULAI';
      let percent = 0;

      if (completedPages > 0) {
        percent = totalPages ? (completedPages / totalPages) * 100 : 0;

        if (completedPages >= (totalPages || 0)) {
          status = 'SELESAI';
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

    const result: StudentTahsinWafaResponse = {
      studentId: student.userId,
      studentName: student.user.fullName,
      currentWafa,
      lastWafa,
      progress: progressList,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching student tahsin wafa progress:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
