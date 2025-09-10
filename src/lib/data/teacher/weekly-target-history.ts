import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function getStudentGroupHistory(groupId: string, studentId: string) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!teacher) throw new Error('Guru tidak ditemukan');

    // Ambil data siswa dari groupHistory dengan relasi lengkap
    const groupHistory = await prisma.groupHistory.findFirst({
      where: {
        groupId: groupId,
        studentId: studentId,
      },
      include: {
        student: {
          select: {
            userId: true,
            nis: true,
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            classroom: {
              select: {
                id: true,
                name: true,
                academicYear: true,
                semester: true,
              },
            },
          },
        },
      },
    });

    if (!groupHistory || !groupHistory.student) return null;

    return {
      id: groupHistory.student.userId,
      nis: groupHistory.student.nis,
      fullName: groupHistory.student.user.fullName,
      group: {
        id: groupHistory.group.id,
        name: groupHistory.group.name,
      },
      classroom: groupHistory.group.classroom
        ? {
            id: groupHistory.group.classroom.id,
            name: groupHistory.group.classroom.name,
            academicYear: groupHistory.group.classroom.academicYear,
            semester: groupHistory.group.classroom.semester,
          }
        : null,
    };
  } catch (error) {
    console.error('Error fetching student group history:', error);
    return null;
  }
}

export async function fetchWeeklyTargetHistory(studentId: string, groupId: string) {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.teacher) {
      throw new Error('Unauthorized');
    }

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!teacher) {
      throw new Error('Guru tidak ditemukan');
    }

    // Verifikasi bahwa grup history ini valid dan guru pernah mengajar di grup tersebut
    const groupHistory = await prisma.groupHistory.findFirst({
      where: {
        studentId,
        groupId,
        teacherId: teacher.userId, // Pastikan guru ini yang mengajar pada periode tersebut
      },
      include: {
        group: {
          include: {
            classroom: {
              select: {
                academicYear: true,
                semester: true,
              },
            },
          },
        },
      },
    });

    if (!groupHistory) {
      throw new Error('Guru tidak pernah mengajar siswa ini di grup tersebut');
    }

    // Ambil targets berdasarkan groupId history yang spesifik
    const targets = await prisma.weeklyTarget.findMany({
      where: {
        studentId: studentId,
        teacherId: teacher.userId,
        groupId: groupId, // Filter berdasarkan groupId history
      },
      orderBy: { startDate: 'desc' },
      include: {
        surahStart: { select: { id: true, name: true, verseCount: true } },
        surahEnd: { select: { id: true, name: true, verseCount: true } },
        wafa: { select: { id: true, name: true, pageCount: true } },
      },
    });

    if (targets.length === 0) {
      return [];
    }

    // Ambil submissions untuk grup history yang spesifik
    const submissions = await prisma.submission.findMany({
      where: {
        studentId,
        groupId: groupId, // Filter berdasarkan groupId history
        date: {
          gte: targets.at(-1)?.startDate,
          lte: targets[0]?.endDate,
        },
      },
    });

    // Hitung progress percentage untuk setiap target
    const targetsWithProgress = targets.map((target) => {
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

      const relevantSubmissions = submissions.filter(
        (s) => s.date >= startDate && s.date <= endDate && s.submissionType === type
      );

      let required = 0;
      let achieved = 0;

      if (type === 'TAHFIDZ' && surahStartId && surahEndId && startAyat && endAyat) {
        // Calculate required verses
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

        // Calculate achieved verses
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

      const progressPercent = required === 0 ? 0 : Math.floor((achieved / required) * 100);

      return {
        ...target,
        progressPercent,
      };
    });

    return targetsWithProgress;
  } catch (error) {
    console.error('Error fetching weekly target history:', error);
    throw new Error('Gagal mengambil data riwayat target');
  }
}