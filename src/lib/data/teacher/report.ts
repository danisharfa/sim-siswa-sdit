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
  schoolInfo: {
    schoolName: string;
    currrentPrincipalName: string;
  };
  tahsin: {
    topic: string;
    score: number;
    grade: string;
    description: string;
  }[];
  tahfidz: {
    surahName: string;
    score: number;
    grade: string;
    description: string;
  }[];
  report: {
    tahfidzScore: number | null;
    tahsinScore: number | null;
    lastTahsinMaterial: string | null;
  };
}

export async function getStudentReportData(
  studentId: string,
  groupId: string
): Promise<StudentReportData | null> {
  const student = await prisma.studentProfile.findUnique({
    where: { userId: studentId },
    include: {
      user: true,
      classroom: true,
    },
  });

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      teacher: {
        include: { user: true },
      },
      classroom: true,
    },
  });

  const [coordinator, schoolInfo, tahsinScores, tahfidzScores, report] = await Promise.all([
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
    prisma.tahsinScore.findMany({
      where: { studentId, groupId },
    }),
    prisma.tahfidzScore.findMany({
      where: { studentId, groupId },
      include: { surah: true },
    }),
    prisma.report.findUnique({
      where: {
        studentId_groupId_academicYear_semester: {
          studentId,
          groupId,
          academicYear: group?.classroom?.academicYear ?? '',
          semester: group?.classroom?.semester ?? 'GANJIL',
        },
      },
    }),
  ]);

  if (!student || !group) return null;

  return {
    fullName: student.user.fullName,
    nis: student.nis,
    nisn: student.nisn ?? '-',
    address: student.user.address ?? '-',
    className: group.classroom?.name ?? '-',
    semester: group.classroom.semester,
    academicYear: group.classroom.academicYear,
    teacherName: group.teacher?.user.fullName ?? '-',
    coordinatorName: coordinator?.user?.fullName ?? '-',
    schoolInfo: {
      schoolName: schoolInfo?.schoolName ?? '-',
      currrentPrincipalName: schoolInfo?.currentPrincipalName ?? '-',
    },
    tahsin: tahsinScores.map((s) => ({
      topic: s.topic,
      score: s.score,
      grade: s.grade,
      description: s.description ?? '-',
    })),
    tahfidz: tahfidzScores.map((s) => ({
      surahName: s.surah.name,
      score: s.score,
      grade: s.grade,
      description: s.description ?? '-',
    })),
    report: {
      tahfidzScore: report?.tahfidzScore ?? null,
      tahsinScore: report?.tahsinScore ?? null,
      lastTahsinMaterial: report?.lastTahsinMaterial ?? null,
    },
  };
}
