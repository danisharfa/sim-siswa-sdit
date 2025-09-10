import { prisma } from '@/lib/prisma';
import { Role, Semester } from '@prisma/client';

export interface StudentReportHistoryData {
  fullName: string;
  nis: string;
  nisn: string;
  address: string | null;
  className: string;
  semester: Semester;
  academicYear: string;
  teacherName: string;
  coordinatorName: string;
  schoolInfo: {
    schoolName: string;
    currrentPrincipalName: string;
  };
  tahsin: {
    topic: string;
    scoreNumeric: number;
    scoreLetter: string;
    description: string;
  }[];
  tahfidz: {
    surahName: string;
    scoreNumeric: number;
    scoreLetter: string;
    description: string;
  }[];
  report: {
    tahfidzScore: number | null;
    tahsinScore: number | null;
    lastTahsinMaterial: string | null;
  };
}

export async function getStudentReportHistoryData(
  studentId: string,
  groupId: string
): Promise<StudentReportHistoryData | null> {
  const [student, groupData, coordinator, schoolInfo] = await Promise.all([
    prisma.studentProfile.findUnique({
      where: { userId: studentId },
      include: {
        user: true,
      },
    }),
    prisma.group.findUnique({
      where: { id: groupId },
      include: {
        classroom: true,
        teacher: {
          include: { user: true },
        },
      },
    }),
    prisma.coordinatorProfile.findFirst({
      where: {
        user: { role: Role.coordinator },
      },
      include: { user: true },
    }),
    prisma.academicSetting.findFirst({
      select: {
        schoolName: true,
        currentPrincipalName: true,
      },
    }),
  ]);

  if (!student || !groupData) return null;

  const [tahsinScores, tahfidzScores, report, groupHistory] = await Promise.all([
    prisma.tahsinScore.findMany({
      where: {
        studentId,
        groupId,
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.tahfidzScore.findMany({
      where: {
        studentId,
        groupId,
      },
      include: { surah: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.report.findUnique({
      where: {
        studentId_groupId_academicYear_semester: {
          studentId,
          groupId,
          academicYear: groupData.classroom?.academicYear ?? '',
          semester: groupData.classroom?.semester ?? 'GANJIL',
        },
      },
    }),
    prisma.groupHistory.findFirst({
      where: {
        studentId,
        groupId,
      },
      include: {
        teacher: {
          include: { user: true },
        },
      },
    }),
  ]);

  let teacherName = '-';
  if (groupHistory?.teacher?.user?.fullName) {
    teacherName = groupHistory.teacher.user.fullName;
  } else if (groupData.teacher?.user?.fullName) {
    teacherName = groupData.teacher.user.fullName;
  }

  const coordinatorName = coordinator?.user?.fullName ?? '-';

  return {
    fullName: student.user.fullName,
    nis: student.nis,
    nisn: student.nisn ?? '-',
    address: student.user.address ?? '-',
    className: groupData.classroom?.name ?? '-',
    semester: groupData.classroom?.semester ?? 'GANJIL',
    academicYear: groupData.classroom?.academicYear ?? '-',
    teacherName,
    coordinatorName,
    schoolInfo: {
      schoolName: schoolInfo?.schoolName ?? '-',
      currrentPrincipalName: schoolInfo?.currentPrincipalName ?? '-',
    },
    tahsin: tahsinScores.map((s) => ({
      topic: s.topic,
      scoreNumeric: s.scoreNumeric,
      scoreLetter: s.scoreLetter,
      description: s.description ?? '-',
    })),
    tahfidz: tahfidzScores.map((s) => ({
      surahName: s.surah.name,
      scoreNumeric: s.scoreNumeric,
      scoreLetter: s.scoreLetter,
      description: s.description ?? '-',
    })),
    report: {
      tahfidzScore: report?.tahfidzScore ?? null,
      tahsinScore: report?.tahsinScore ?? null,
      lastTahsinMaterial: report?.lastTahsinMaterial ?? null,
    },
  };
}
