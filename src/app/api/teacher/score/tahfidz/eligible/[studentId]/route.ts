import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

type Params = Promise<{ studentId: string }>;

// untuk mendapatkan daftar surah yang sudah lulus tashih
export async function GET(req: NextRequest, segmentData: { params: Params }) {
  const params = await segmentData.params;
  const studentId = params.studentId;

  const results = await prisma.tashihRequest.findMany({
    where: {
      studentId: studentId,
      tashihType: 'ALQURAN',
      status: 'SELESAI',
      results: {
        some: {
          passed: true,
        },
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
