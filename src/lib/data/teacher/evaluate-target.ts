import { prisma } from '@/lib/prisma';
import { TargetStatus, WeeklyTarget } from '@prisma/client';

// Tipe untuk ayat
type Ayat = { surahId: number; ayat: number };

// Extended tipe untuk target agar mencakup progress
type WeeklyTargetWithRelations = WeeklyTarget & {
  surahStart: { id: number; verseCount: number } | null;
  surahEnd: { id: number; verseCount: number } | null;
  progressPercent?: number | null;
};

// Cache jumlah ayat per surah
let surahVerseCache: Record<number, number> | null = null;

// Prefetch semua jumlah ayat per surah dan simpan ke cache
export async function prefetchSurahVerseCounts(): Promise<void> {
  const allSurah = await prisma.surah.findMany({
    select: {
      id: true,
      verseCount: true,
    },
  });

  surahVerseCache = allSurah.reduce((acc, surah) => {
    acc[surah.id] = surah.verseCount;
    return acc;
  }, {} as Record<number, number>);
}

function getVerseCountFromCache(surahId: number): number {
  if (!surahVerseCache) {
    throw new Error(
      'Surah verse count cache belum diinisialisasi. Panggil prefetchSurahVerseCounts() terlebih dahulu.'
    );
  }
  return surahVerseCache[surahId] ?? 0;
}

function getTargetAyatRange(target: WeeklyTargetWithRelations): Ayat[] {
  const { surahStartId, surahEndId, startAyat, endAyat, surahStart, surahEnd } = target;

  if (!surahStartId || !surahEndId || !startAyat || !endAyat) return [];

  const result: Ayat[] = [];

  for (let surahId = surahStartId; surahId <= surahEndId; surahId++) {
    const verseCount =
      surahId === surahStartId
        ? surahStart?.verseCount ?? 0
        : surahId === surahEndId
        ? surahEnd?.verseCount ?? 0
        : getVerseCountFromCache(surahId);

    if (!verseCount) continue;

    const from = surahId === surahStartId ? startAyat : 1;
    const to = surahId === surahEndId ? endAyat : verseCount;

    for (let i = from; i <= to; i++) {
      result.push({ surahId, ayat: i });
    }
  }

  return result;
}

function extractSubmittedAyats(
  submissions: {
    surahId: number | null;
    startVerse: number | null;
    endVerse: number | null;
  }[]
): Set<string> {
  const set = new Set<string>();

  for (const s of submissions) {
    if (!s.surahId || !s.startVerse || !s.endVerse) continue;

    for (let i = s.startVerse; i <= s.endVerse; i++) {
      set.add(`${s.surahId}:${i}`);
    }
  }

  return set;
}

export async function evaluateTargetAchievement(
  studentId: string,
  fromDate: Date,
  toDate: Date
): Promise<void> {
  await prefetchSurahVerseCounts();

  const targets = await prisma.weeklyTarget.findMany({
    where: {
      studentId,
      startDate: { lte: toDate },
      endDate: { gte: fromDate },
    },
    include: {
      surahStart: { select: { id: true, verseCount: true } },
      surahEnd: { select: { id: true, verseCount: true } },
    },
  });

  for (const target of targets as WeeklyTargetWithRelations[]) {
    const submissions = await prisma.submission.findMany({
      where: {
        studentId,
        submissionType: target.type,
        date: {
          gte: target.startDate,
          lte: target.endDate,
        },
      },
      select: {
        surahId: true,
        startVerse: true,
        endVerse: true,
      },
    });

    const requiredAyats = getTargetAyatRange(target);
    const submittedAyats = extractSubmittedAyats(submissions);

    const achievedCount = requiredAyats.filter((ayat) =>
      submittedAyats.has(`${ayat.surahId}:${ayat.ayat}`)
    ).length;

    const totalTarget = requiredAyats.length;
    const progress = totalTarget > 0 ? Math.round((achievedCount / totalTarget) * 100) : 0;
    const newStatus = progress === 100 ? TargetStatus.TERCAPAI : TargetStatus.TIDAK_TERCAPAI;

    if (target.status !== newStatus || target.progressPercent !== progress) {
      await prisma.weeklyTarget.update({
        where: { id: target.id },
        data: {
          status: newStatus,
          progressPercent: progress,
        },
      });
    }

    console.log(
      `[TARGET] ${target.id} → ${achievedCount}/${totalTarget} = ${progress}% → ${newStatus}`
    );
  }
}
