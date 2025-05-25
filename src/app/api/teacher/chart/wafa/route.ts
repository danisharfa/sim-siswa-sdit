import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role, TashihRequestStatus, TashihType } from '@prisma/client';

export async function GET() {
  try {
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

    // Ambil semua siswa dari kelompok guru ini
    const groups = await prisma.teacherGroup.findMany({
      where: { teacherId: teacher.id },
      include: {
        group: {
          include: {
            students: {
              include: {
                user: true,
                tashihRequests: {
                  where: {
                    tashihType: TashihType.WAFA,
                    status: TashihRequestStatus.SELESAI,
                    results: { some: { passed: true } },
                  },
                  include: {
                    wafa: true,
                    results: { where: { passed: true }, select: { id: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Hitung total halaman tiap buku wafa (global)
    const wafaBooks = await prisma.wafa.findMany({
      select: { id: true, name: true, pageCount: true },
    });
    const wafaMap = Object.fromEntries(wafaBooks.map((w) => [w.id, w.pageCount || 0]));

    const result = [];

    for (const tg of groups) {
      for (const student of tg.group.students) {
        const tashihs = student.tashihRequests;
        const progressMap: Record<number, number> = {};
        let lastWafa = '';
        let currentWafa: number | null = null;

        for (const req of tashihs) {
          const { wafa, startPage, endPage } = req;
          if (!wafa || startPage == null || endPage == null) continue;

          const pages = endPage - startPage + 1;
          progressMap[wafa.id] = (progressMap[wafa.id] || 0) + pages;
          lastWafa = wafa.name;
        }

        const progressList = Object.entries(progressMap).map(([wafaIdStr, donePages]) => {
          const wafaId = Number(wafaIdStr);
          const total = wafaMap[wafaId] || 0;
          const percent = total > 0 ? (donePages / total) * 100 : 0;
          const status = percent === 100 ? 'SELESAI' : 'SEDANG_DIJALANI';
          if (status === 'SEDANG_DIJALANI') currentWafa = wafaId;
          return {
            wafaId,
            wafaName: wafaBooks.find((w) => w.id === wafaId)?.name || `Wafa ${wafaId}`,
            completedPages: donePages,
            totalPages: total,
            percent: Math.round(percent * 100) / 100,
            status,
          };
        });

        result.push({
          studentId: student.id,
          studentName: student.user.fullName,
          lastWafa,
          currentWafa,
          progress: progressList.sort((a, b) => b.wafaId - a.wafaId),
        });
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching wafa chart:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
