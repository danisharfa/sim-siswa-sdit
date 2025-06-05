import { prisma } from '@/lib/prisma';
import { Role, Semester } from '@prisma/client';

export interface StudentReportData {
  fullName: string;
  nis: string;
  nisn: string;
  address: string | null;
  className: string;
  semester: Semester;
  academicYear: string;
  teacherName: string;
  coordinatorName: string;
  tahsin: {
    topic: string;
    scoreNumeric: number;
    scoreLetter: string;
    description: string;
  }[];
  tahsinSummary: {
    averageScore: number | null;
    lastMaterial: string | null;
  };
  tahfidz: {
    surahName: string;
    scoreNumeric: number;
    scoreLetter: string;
    description: string;
  }[];
  tahfidzSummary: {
    averageScore: number | null;
  };
}

export async function getStudentReportData(
  studentId: string,
  groupId: string
): Promise<StudentReportData | null> {
  const [student, group, coordinator, tahsinScores, tahsinSummary, tahfidzScores, tahfidzSummary] =
    await Promise.all([
      prisma.studentProfile.findUnique({
        where: { id: studentId },
        include: {
          user: true,
          classroom: true,
        },
      }),
      prisma.group.findUnique({
        where: { id: groupId },
        include: {
          teacherGroups: {
            include: {
              teacher: {
                include: { user: true },
              },
            },
          },
          classroom: true,
        },
      }),
      prisma.coordinatorProfile.findFirst({
        where: {
          user: { role: Role.coordinator },
        },
        include: { user: true },
      }),
      prisma.tahsinScore.findMany({
        where: { studentId, groupId },
      }),
      prisma.tahsinSummary.findUnique({
        where: { studentId_groupId: { studentId, groupId } },
      }),
      prisma.tahfidzScore.findMany({
        where: { studentId, groupId },
        include: { surah: true },
      }),
      prisma.tahfidzSummary.findUnique({
        where: { studentId_groupId: { studentId, groupId } },
      }),
    ]);

  if (!student || !group) return null;

  return {
    fullName: student.user.fullName,
    nis: student.nis,
    nisn: student.nisn ?? '-',
    address: student.address ?? '-',
    className: group.classroom?.name ?? '-',
    semester: group.classroom.semester,
    academicYear: group.classroom.academicYear,
    teacherName: group.teacherGroups?.[0]?.teacher?.user.fullName ?? '-',
    coordinatorName: coordinator?.user?.fullName ?? '-',
    tahsin: tahsinScores.map((s) => ({
      topic: s.topic,
      scoreNumeric: s.scoreNumeric,
      scoreLetter: s.scoreLetter,
      description: s.description ?? '-',
    })),
    tahsinSummary: {
      averageScore: tahsinSummary?.averageScore ?? null,
      lastMaterial: tahsinSummary?.lastMaterial ?? null,
    },
    tahfidz: tahfidzScores.map((s) => ({
      surahName: s.surah.name,
      scoreNumeric: s.scoreNumeric,
      scoreLetter: s.scoreLetter,
      description: s.description ?? '-',
    })),
    tahfidzSummary: {
      averageScore: tahfidzSummary?.averageScore ?? null,
    },
  };
}

