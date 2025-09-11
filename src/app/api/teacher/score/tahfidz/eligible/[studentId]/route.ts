import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

type Params = Promise<{ studentId: string }>;

// Mendapatkan daftar surah yang sudah lulus tashih dan belum dinilai
export async function GET(req: NextRequest, segmentData: { params: Params }) {
  const params = await segmentData.params;
  const studentId = params.studentId;

  // Ambil semua surah yang sudah dinilai oleh guru (tanpa cek tahun/semester)
  const scoredSurahIds = await prisma.tahfidzScore
    .findMany({
      where: {
        studentId,
      },
      select: {
        surahId: true,
      },
    })
    .then((list) => list.map((s) => s.surahId));

  // Ambil semua tashih selesai dan lulus yang belum dinilai
  const results = await prisma.tashihRequest.findMany({
    where: {
      studentId,
      tashihType: 'ALQURAN',
      status: 'SELESAI',
      result: {
        is: {
          passed: true,
        },
      },
      surahId: {
        notIn: scoredSurahIds,
      },
    },
    select: {
      surah: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const surahList = results.map((r) => r.surah).filter(Boolean);

  return NextResponse.json({ data: surahList });
}
