import { prisma } from '@/lib/prisma';
import { SubmissionType, TargetStatus, WeeklyTarget, SubmissionStatus } from '@prisma/client';

type Verse = { surahId: number; verse: number };
type Page = { wafaId: number; page: number };

type WeeklyTargetWithSurah = WeeklyTarget & {
  surahStart: { id: number; verseCount: number } | null;
  surahEnd: { id: number; verseCount: number } | null;
};

let verseCache: Record<number, number> | null = null;

export async function prefetchSurahVerseCounts() {
  const surahList = await prisma.surah.findMany({
    select: { id: true, verseCount: true },
  });
  verseCache = Object.fromEntries(surahList.map(({ id, verseCount }) => [id, verseCount]));
}

function getVerseCount(surahId: number): number {
  if (!verseCache) throw new Error('Cache belum dimuat.');
  return verseCache[surahId] ?? 0;
}

function getTargetVerses(target: WeeklyTargetWithSurah): Verse[] {
  const { surahStartId, surahEndId, startAyat, endAyat, surahStart, surahEnd } = target;
  if (!surahStartId || !surahEndId || !startAyat || !endAyat) return [];

  const result: Verse[] = [];
  for (let id = surahStartId; id <= surahEndId; id++) {
    const totalAyat =
      id === surahStartId
        ? surahStart?.verseCount
        : id === surahEndId
        ? surahEnd?.verseCount
        : getVerseCount(id);

    const from = id === surahStartId ? startAyat : 1;
    const to = id === surahEndId ? endAyat : totalAyat ?? 0;

    for (let i = from; i <= to; i++) {
      result.push({ surahId: id, verse: i });
    }
  }
  return result;
}

function extractSubmittedVerses(
  submissions: {
    surahId: number | null;
    startVerse: number | null;
    endVerse: number | null;
    submissionStatus: SubmissionStatus;
  }[]
): Set<string> {
  const result = new Set<string>();
  for (const { surahId, startVerse, endVerse, submissionStatus } of submissions) {
    // Hanya hitung submission yang LULUS
    if (submissionStatus !== SubmissionStatus.LULUS) continue;
    if (!surahId || !startVerse || !endVerse) continue;
    
    for (let i = startVerse; i <= endVerse; i++) {
      result.add(`${surahId}:${i}`);
    }
  }
  return result;
}

function getTargetPages(target: WeeklyTarget): Page[] {
  const { wafaId, startPage, endPage } = target;
  if (!wafaId || !startPage || !endPage) return [];

  const result: Page[] = [];
  for (let i = startPage; i <= endPage; i++) {
    result.push({ wafaId, page: i });
  }
  return result;
}

function extractSubmittedPages(
  submissions: {
    wafaId: number | null;
    startPage: number | null;
    endPage: number | null;
    submissionStatus: SubmissionStatus;
  }[]
): Set<string> {
  const set = new Set<string>();
  for (const { wafaId, startPage, endPage, submissionStatus } of submissions) {
    // Hanya hitung submission yang LULUS
    if (submissionStatus !== SubmissionStatus.LULUS) continue;
    if (!wafaId || !startPage || !endPage) continue;
    
    for (let i = startPage; i <= endPage; i++) {
      set.add(`${wafaId}:${i}`);
    }
  }
  return set;
}

export async function evaluateTargetAchievement(studentId: string, from: Date, to: Date) {
  await prefetchSurahVerseCounts();

  const targets = await prisma.weeklyTarget.findMany({
    where: { studentId, startDate: { lte: to }, endDate: { gte: from } },
    include: {
      surahStart: { select: { id: true, verseCount: true } },
      surahEnd: { select: { id: true, verseCount: true } },
    },
  });

  for (const target of targets as WeeklyTargetWithSurah[]) {
    const submissions = await prisma.submission.findMany({
      where: {
        studentId,
        submissionType: target.type,
        date: { gte: target.startDate, lte: target.endDate },
      },
      select: {
        surahId: true,
        startVerse: true,
        endVerse: true,
        wafaId: true,
        startPage: true,
        endPage: true,
        submissionStatus: true, // Tambahkan field ini
      },
    });

    let total = 0;
    let matched = 0;

    if (target.type === SubmissionType.TAHFIDZ || target.type === SubmissionType.TAHSIN_ALQURAN) {
      const required = getTargetVerses(target);
      const submitted = extractSubmittedVerses(submissions);
      matched = required.filter((v) => submitted.has(`${v.surahId}:${v.verse}`)).length;
      total = required.length;
    }

    if (target.type === SubmissionType.TAHSIN_WAFA) {
      const required = getTargetPages(target);
      const submitted = extractSubmittedPages(submissions);
      matched = required.filter((p) => submitted.has(`${p.wafaId}:${p.page}`)).length;
      total = required.length;
    }

    const progress = total > 0 ? Math.round((matched / total) * 100) : 0;
    const status = progress === 100 ? TargetStatus.TERCAPAI : TargetStatus.TIDAK_TERCAPAI;

    if (target.status !== status || target.progressPercent !== progress) {
      await prisma.weeklyTarget.update({
        where: { id: target.id },
        data: { status, progressPercent: progress },
      });
    }

    console.log(`[TARGET] ${target.id} = ${matched}/${total} (${progress}%) → ${status}`);
  }
}