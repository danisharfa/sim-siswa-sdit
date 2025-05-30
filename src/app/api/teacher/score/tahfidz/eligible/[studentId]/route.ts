import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

type Params = Promise<{ studentId: string }>;

// untuk mendapatkan daftar surah yang sudah lulus tashih
export async function GET(req: NextRequest, segmentData: { params: Params }) {
  const params = await segmentData.params;
  const studentId = params.studentId;

  // Get current academic settings
  const academicSetting = await prisma.academicSetting.findFirst();
  if (!academicSetting) {
    return NextResponse.json({ error: 'Academic settings not found' }, { status: 404 });
  }

  const { currentYear, currentSemester } = academicSetting;

  // Console log untuk debugging - ambil data surah yang sudah dinilai
  const scoredSurahs = await prisma.tahfidzScore.findMany({
    where: {
      studentId: studentId,
      OR: [
        // Previous academic years
        {
          academicYear: {
            lt: currentYear,
          },
        },
        // Same academic year but previous semester
        {
          AND: [
            { academicYear: currentYear },
            { semester: currentSemester === 'GENAP' ? 'GANJIL' : undefined },
          ],
        },
      ],
    },
    select: {
      id: true,
      surahId: true,
      academicYear: true,
      semester: true,
      surah: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  console.log('=== DATA SURAH YANG SUDAH DINILAI ===');
  console.log('Student ID:', studentId);
  console.log('Current Academic Year:', currentYear);
  console.log('Current Semester:', currentSemester);
  console.log('Total scored surahs:', scoredSurahs.length);
  console.log('Scored surahs details:', scoredSurahs);
  console.log(
    'Scored surah names:',
    scoredSurahs.map((s) => s.surah.name)
  );

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
      surah: {
        // Exclude surahs that already have scores for current or previous periods
        NOT: {
          tahfidzScores: {
            some: {
              studentId: studentId,
              OR: [
                // Previous academic years
                {
                  academicYear: {
                    lt: currentYear,
                  },
                },
                // Same academic year but previous semester
                {
                  AND: [
                    { academicYear: currentYear },
                    { semester: currentSemester === 'GENAP' ? 'GANJIL' : undefined },
                  ],
                },
              ],
            },
          },
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

  console.log('=== SURAH YANG ELIGIBLE UNTUK DINILAI ===');
  console.log('Total eligible surahs:', surahList.length);
  console.log(
    'Eligible surah names:',
    surahList.map((s) => s?.name)
  );

  return NextResponse.json({ data: surahList });
}
