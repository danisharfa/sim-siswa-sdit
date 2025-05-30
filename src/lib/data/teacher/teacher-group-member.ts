import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function getGroupId(groupId: string) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!teacher) throw new Error('Guru tidak ditemukan');

    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        teacherGroups: {
          some: {
            teacherId: teacher.id,
          },
        },
      },
      include: {
        classroom: true,
      },
    });

    return group;
  } catch (error) {
    console.error('Error fetching teacher group:', error);
    return null;
  }
}

export async function fetchGroupMembersForTeacher(groupId: string) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!teacher) throw new Error('Guru tidak ditemukan');

    const isGroupBimbingan = await prisma.teacherGroup.findFirst({
      where: {
        groupId,
        teacherId: teacher.id,
      },
    });
    if (!isGroupBimbingan) throw new Error('Kelompok ini bukan bimbingan Anda');

    const members = await prisma.studentProfile.findMany({
      where: { groupId },
      orderBy: { nis: 'asc' },
      select: {
        id: true,
        nis: true,
        user: {
          select: { fullName: true },
        },
      },
    });

    return members.map((m) => ({
      id: m.id,
      nis: m.nis,
      fullName: m.user?.fullName || 'Tidak diketahui',
    }));
  } catch (error) {
    console.error('[FETCH_GROUP_MEMBERS_ERROR]', error);
    throw new Error('Gagal mengambil data member kelompok binaan');
  }
}

export async function getStudentForTeacherGroup(groupId: string, studentId: string) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!teacher) throw new Error('Guru tidak ditemukan');

    const student = await prisma.studentProfile.findFirst({
      where: {
        id: studentId,
        groupId: groupId,
      },
      select: {
        id: true,
        nis: true,
        user: {
          select: {
            fullName: true,
          },
        },
      },
    });

    if (!student) return null;

    return {
      id: student.id,
      nis: student.nis,
      fullName: student.user.fullName,
    };
  } catch (error) {
    console.error('Error fetching student for teacher group:', error);
    return null;
  }
}

export async function getGroupHistoryId(groupId: string) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!teacher) throw new Error('Guru tidak ditemukan');

    const group = await prisma.groupHistory.findFirst({
      where: {
        groupId,
      },
      include: {
        group: {
          include: {
            classroom: true,
          },
        },
        student: {
          select: {
            id: true,
            nis: true,
            user: {
              select: { fullName: true },
            },
          },
        },
      },
    });

    return group;
  } catch (error) {
    console.error('Error fetching teacher group:', error);
    return null;
  }
}

export async function fetchGroupHistoryMembersForTeacher(groupId: string) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!teacher) throw new Error('Guru tidak ditemukan');

    // Ambil semua groupHistory dengan groupId ini
    const groupHistories = await prisma.groupHistory.findMany({
      where: { groupId },
      include: {
        group: {
          include: {
            teacherGroups: true,
          },
        },
        student: {
          select: {
            id: true,
            nis: true,
            user: {
              select: { fullName: true },
            },
          },
        },
      },
    });

    if (!groupHistories || groupHistories.length === 0)
      throw new Error('Group history tidak ditemukan');

    // Pastikan guru adalah pembimbing group ini
    const isGroupBimbingan = groupHistories[0].group.teacherGroups.some(
      (tg) => tg.teacherId === teacher.id
    );
    if (!isGroupBimbingan) throw new Error('Kelompok ini bukan bimbingan Anda');

    // Map semua student unik dari groupHistories
    const uniqueStudents = new Map();
    groupHistories.forEach((gh) => {
      if (gh.student) {
        uniqueStudents.set(gh.student.id, {
          id: gh.student.id,
          nis: gh.student.nis,
          fullName: gh.student.user?.fullName || 'Tidak diketahui',
        });
      }
    });

    return Array.from(uniqueStudents.values());
  } catch (error) {
    console.error('[FETCH_GROUP_HISTORY_MEMBERS_ERROR]', error);
    throw new Error('Gagal mengambil data member group history');
  }
}

export async function getStudentForTeacherGroupHistory(groupId: string, studentId: string) {
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
            id: true,
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
      id: groupHistory.student.id,
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
    console.error('Error fetching student for teacher group history:', error);
    return null;
  }
}

export async function fetchWeeklyTargetHistory(studentId: string) {
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

    // Verify teacher is mentoring this student
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      select: { groupId: true },
    });
    if (!student || !student.groupId) {
      throw new Error('Siswa tidak ditemukan atau tidak memiliki kelompok');
    }

    const isMembimbing = await prisma.teacherGroup.findFirst({
      where: {
        teacherId: teacher.id,
        groupId: student.groupId,
      },
    });

    if (!isMembimbing) {
      throw new Error('Guru tidak membimbing siswa ini');
    }

    const targets = await prisma.weeklyTarget.findMany({
      where: {
        studentId: studentId,
        teacherId: teacher.id,
      },
      orderBy: { startDate: 'desc' },
      include: {
        surahStart: { select: { id: true, name: true, verseCount: true } },
        surahEnd: { select: { id: true, name: true, verseCount: true } },
        wafa: { select: { id: true, name: true, pageCount: true } },
      },
    });

    // Get all submissions for progress calculation
    const submissions = await prisma.submission.findMany({
      where: {
        studentId,
        date: {
          gte: targets.at(-1)?.startDate,
          lte: targets[0]?.endDate,
        },
      },
    });

    // Calculate progress percentage for each target
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
