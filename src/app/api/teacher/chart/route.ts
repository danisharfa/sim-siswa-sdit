import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { TashihRequestStatus, TashihType } from '@prisma/client';

export async function GET() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'teacher') {
    return new NextResponse('Unauthorized', { status: 401 });
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
                  tashihType: TashihType.ALQURAN,
                  status: TashihRequestStatus.SELESAI,
                  results: {
                    some: { passed: true },
                  },
                },
                include: {
                  surah: {
                    include: {
                      surahJuz: true,
                    },
                  },
                  results: {
                    where: { passed: true },
                    select: { id: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  // Hitung jumlah surah per juz (global)
  const surahCounts = await prisma.surahJuz.groupBy({
    by: ['juzId'],
    _count: { id: true },
  });

  const surahMap = Object.fromEntries(surahCounts.map((j) => [j.juzId, j._count.id]));

  const result = [];

  for (const tg of groups) {
    for (const student of tg.group.students) {
      const tashihs = student.tashihRequests;
      const progressMap: Record<number, number> = {};
      let lastSurah = '';
      let currentJuz: number | null = null;

      for (const req of tashihs) {
        if (!req.surah?.surahJuz?.length) continue;

        lastSurah = req.surah.name;
        for (const rel of req.surah.surahJuz) {
          const juzId = rel.juzId;
          progressMap[juzId] = (progressMap[juzId] || 0) + 1;
        }
      }

      const progressList = Object.entries(progressMap).map(([juzIdStr, count]) => {
        const juzId = Number(juzIdStr);
        const total = surahMap[juzId] || 0;
        const percent = total > 0 ? (count / total) * 100 : 0;
        const status = percent === 100 ? 'SELESAI' : 'SEDANG_DIJALANI';
        if (status === 'SEDANG_DIJALANI') currentJuz = juzId;
        return {
          juzId,
          juzName: `Juz ${juzId}`,
          completedSurah: count,
          totalSurah: total,
          percent: Math.round(percent * 100) / 100,
          status,
        };
      });

      result.push({
        studentId: student.id,
        studentName: student.user.fullName,
        lastSurah,
        currentJuz,
        progress: progressList.sort((a, b) => b.juzId - a.juzId),
      });
    }
  }

  return NextResponse.json(result);
}
