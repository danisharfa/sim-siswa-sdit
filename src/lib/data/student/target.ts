import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role, Semester, SubmissionType, TargetStatus, SubmissionStatus } from '@prisma/client';

export interface AcademicPeriodInfo {
  academicYear: string;
  semester: Semester;
  groupName: string;
  className: string;
  teacherName: string;
}

export interface WeeklyTargetData {
  id: string;
  type: SubmissionType;
  startDate: Date;
  endDate: Date;
  description: string;
  status: TargetStatus;
  progressPercent: number;
  surahStart?: {
    id: number;
    name: string;
    verseCount: number | null;
  } | null;
  surahEnd?: {
    id: number;
    name: string;
    verseCount: number | null;
  } | null;
  wafa?: {
    id: number;
    name: string;
    pageCount: number | null;
  } | null;
  startAyat?: number | null;
  endAyat?: number | null;
  startPage?: number | null;
  endPage?: number | null;
}

export interface StudentTargetData {
  fullName: string;
  nis: string;
  allTargets: {
    period: AcademicPeriodInfo;
    targets: WeeklyTargetData[];
    groupId: string;
  }[];
}

export async function fetchTargets(): Promise<StudentTargetData> {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.student) {
      throw new Error('Unauthorized');
    }

    const student = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            fullName: true,
          },
        },
      },
    });

    if (!student) {
      throw new Error('Profil siswa tidak ditemukan');
    }

    // Get all weekly targets for this student
    const allTargets = await prisma.weeklyTarget.findMany({
      where: { studentId: student.userId },
      include: {
        surahStart: { select: { id: true, name: true, verseCount: true } },
        surahEnd: { select: { id: true, name: true, verseCount: true } },
        wafa: { select: { id: true, name: true, pageCount: true } },
        group: {
          select: {
            id: true,
            name: true,
            classroom: {
              select: { name: true, academicYear: true, semester: true },
            },
            teacher: {
              include: { user: { select: { fullName: true } } },
            },
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    // Extract unique academic periods from targets
    const periodsMap = new Map();

    allTargets.forEach((target) => {
      if (target.group.classroom) {
        const key = `${target.group.classroom.academicYear}-${target.group.classroom.semester}`;
        if (!periodsMap.has(key)) {
          periodsMap.set(key, {
            academicYear: target.group.classroom.academicYear,
            semester: target.group.classroom.semester,
            groupName: target.group.name,
            className: target.group.classroom.name,
            teacherName: target.group.teacher?.user.fullName ?? '-',
            groupId: target.groupId,
          });
        }
      }
    });

    // Get all submissions for progress calculation - INCLUDE submissionStatus
    const submissions = await prisma.submission.findMany({
      where: {
        studentId: student.userId,
        date: {
          gte: allTargets.length > 0 ? allTargets[allTargets.length - 1].startDate : new Date(),
          lte: allTargets.length > 0 ? allTargets[0].endDate : new Date(),
        },
      },
      select: {
        date: true,
        submissionType: true,
        surahId: true,
        startVerse: true,
        endVerse: true,
        wafaId: true,
        startPage: true,
        endPage: true,
        submissionStatus: true, // Tambahkan field ini
      },
    });

    // Build target data for each period
    const targetData = Array.from(periodsMap.entries()).map(([periodKey, periodInfo]) => {
      const [academicYear, semester] = periodKey.split('-');

      // Filter targets for this period
      const targetsForPeriod = allTargets.filter((target) => target.groupId === periodInfo.groupId);

      // Calculate progress for each target
      const targetsWithProgress = targetsForPeriod.map((target) => {
        const {
          startDate,
          endDate,
          type,
          surahStartId,
          surahEndId,
          startAyat,
          endAyat,
          wafaId,
          startPage,
          endPage,
        } = target;

        // Filter submissions by date, type, and ONLY LULUS status
        const relevantSubmissions = submissions.filter(
          (s) =>
            s.date >= startDate &&
            s.date <= endDate &&
            s.submissionType === type &&
            s.submissionStatus === SubmissionStatus.LULUS // Hanya hitung yang LULUS
        );

        let required = 0;
        let achieved = 0;

        if (type === 'TAHFIDZ' && surahStartId && surahEndId && startAyat && endAyat) {
          const ayats = [];
          for (let surahId = surahStartId; surahId <= surahEndId; surahId++) {
            const verseCount =
              surahId === surahStartId
                ? target.surahStart?.verseCount ?? 0
                : surahId === surahEndId
                ? target.surahEnd?.verseCount ?? 0
                : 0;
            const from = surahId === surahStartId ? startAyat : 1;
            const to = surahId === surahEndId ? endAyat : verseCount;

            for (let i = from; i <= to; i++) {
              ayats.push(`${surahId}:${i}`);
            }
          }
          required = ayats.length;

          const submitted = new Set<string>();
          for (const s of relevantSubmissions) {
            if (!s.surahId || !s.startVerse || !s.endVerse) continue;
            for (let i = s.startVerse; i <= s.endVerse; i++) {
              submitted.add(`${s.surahId}:${i}`);
            }
          }

          achieved = ayats.filter((a) => submitted.has(a)).length;
        }

        if (type === 'TAHSIN_WAFA' && wafaId && startPage && endPage) {
          required = endPage - startPage + 1;
          const submitted = new Set<number>();
          for (const s of relevantSubmissions) {
            if (s.wafaId === wafaId && s.startPage && s.endPage) {
              for (let i = s.startPage; i <= s.endPage; i++) {
                submitted.add(i);
              }
            }
          }
          achieved = Array.from({ length: required }, (_, i) => startPage + i).filter((p) =>
            submitted.has(p)
          ).length;
        }

        if (type === 'TAHSIN_ALQURAN' && surahStartId && surahEndId && startAyat && endAyat) {
          const ayats = [];
          for (let surahId = surahStartId; surahId <= surahEndId; surahId++) {
            const verseCount =
              surahId === surahStartId
                ? target.surahStart?.verseCount ?? 0
                : surahId === surahEndId
                ? target.surahEnd?.verseCount ?? 0
                : 0;
            const from = surahId === surahStartId ? startAyat : 1;
            const to = surahId === surahEndId ? endAyat : verseCount;

            for (let i = from; i <= to; i++) {
              ayats.push(`${surahId}:${i}`);
            }
          }
          required = ayats.length;

          const submitted = new Set<string>();
          for (const s of relevantSubmissions) {
            if (!s.surahId || !s.startVerse || !s.endVerse) continue;
            for (let i = s.startVerse; i <= s.endVerse; i++) {
              submitted.add(`${s.surahId}:${i}`);
            }
          }

          achieved = ayats.filter((a) => submitted.has(a)).length;
        }

        const progressPercent = required === 0 ? 0 : Math.floor((achieved / required) * 100);

        return {
          id: target.id,
          type: target.type,
          startDate: target.startDate,
          endDate: target.endDate,
          description: target.description,
          status: target.status,
          progressPercent, // Gunakan progressPercent yang dihitung ulang
          surahStart: target.surahStart,
          surahEnd: target.surahEnd,
          wafa: target.wafa,
          startAyat: target.startAyat,
          endAyat: target.endAyat,
          startPage: target.startPage,
          endPage: target.endPage,
        };
      });

      return {
        period: {
          academicYear,
          semester: semester as Semester,
          groupName: periodInfo.groupName,
          className: periodInfo.className,
          teacherName: periodInfo.teacherName,
        },
        targets: targetsWithProgress,
        groupId: periodInfo.groupId,
      };
    });

    // Sort target data by academic year and semester
    const sortedTargetData = targetData.sort((a, b) => {
      if (a.period.academicYear !== b.period.academicYear) {
        return b.period.academicYear.localeCompare(a.period.academicYear);
      }
      return b.period.semester.localeCompare(a.period.semester);
    });

    return {
      fullName: student.user.fullName,
      nis: student.nis,
      allTargets: sortedTargetData,
    };
  } catch (error) {
    console.error('[FETCH_TARGETS]', error);
    throw new Error('Gagal mengambil data target');
  }
}
