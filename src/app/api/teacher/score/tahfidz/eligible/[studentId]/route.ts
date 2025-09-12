import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

type Params = Promise<{ studentId: string }>;

// Mendapatkan daftar surah yang sudah lulus tashih dan belum dinilai di semester ini
export async function GET(req: NextRequest, segmentData: { params: Params }) {
  const params = await segmentData.params;
  const studentId = params.studentId;

  // Ambil semua surah yang sudah dinilai oleh guru di semester ini (semua period)
  const scoredSurahIds = await prisma.tahfidzScore
    .findMany({
      where: {
        studentId,
        // Ambil semua periode dalam semester yang sama, bukan hanya period tertentu
      },
      select: {
        surahId: true,
      },
    })
    .then((list) => list.map((s) => s.surahId));

  // Ambil semua tashih selesai dan lulus yang belum dinilai di semester ini
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
