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
  tahsin: {
    topic: string;
    scoreNumeric: number;
    scoreLetter: string;
    description: string;
  }[];
  tahsinSummary: {
    averageScore: number | null;
    lastMaterial: string | null;
  } | null;
  tahfidz: {
    surahName: string;
    scoreNumeric: number;
    scoreLetter: string;
    description: string;
  }[];
  tahfidzSummary: {
    averageScore: number | null;
  } | null;
}

export async function getStudentReportHistoryData(
  studentId: string,
  groupId: string
): Promise<StudentReportHistoryData | null> {
  // Ambil data student dan group history
  const [student, groupData, coordinator] = await Promise.all([
    prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        user: true,
      },
    }),
    prisma.group.findUnique({
      where: { id: groupId },
      include: {
        classroom: true,
        teacherGroups: {
          include: {
            teacher: {
              include: { user: true },
            },
          },
        },
      },
    }),
    prisma.coordinatorProfile.findFirst({
      where: {
        user: { role: Role.coordinator },
      },
      include: { user: true },
    }),
  ]);

  if (!student || !groupData) return null;

  // Ambil data scores berdasarkan groupId
  const [tahsinScores, tahsinSummary, tahfidzScores, tahfidzSummary, groupHistory] = await Promise.all([
    prisma.tahsinScore.findMany({
      where: { 
        studentId, 
        groupId 
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.tahsinSummary.findUnique({
      where: { 
        studentId_groupId: { 
          studentId, 
          groupId 
        } 
      },
    }),
    prisma.tahfidzScore.findMany({
      where: { 
        studentId, 
        groupId 
      },
      include: { surah: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.tahfidzSummary.findUnique({
      where: { 
        studentId_groupId: { 
          studentId, 
          groupId 
        } 
      },
    }),
    // Ambil group history untuk mendapatkan teacher yang mengajar pada periode tersebut
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

  // Tentukan teacher name dari group history atau teacher group saat ini
  let teacherName = '-';
  if (groupHistory?.teacher?.user?.fullName) {
    teacherName = groupHistory.teacher.user.fullName;
  } else if (groupData.teacherGroups?.[0]?.teacher?.user?.fullName) {
    teacherName = groupData.teacherGroups[0].teacher.user.fullName;
  }

  const coordinatorName = coordinator?.user?.fullName ?? '-';

  // Format data response
  return {
    fullName: student.user.fullName,
    nis: student.nis,
    nisn: student.nisn ?? '-',
    address: student.address ?? '-',
    className: groupData.classroom?.name ?? '-',
    semester: groupData.classroom?.semester ?? 'GANJIL',
    academicYear: groupData.classroom?.academicYear ?? '-',
    teacherName,
    coordinatorName,
    tahsin: tahsinScores.map((s) => ({
      topic: s.topic,
      scoreNumeric: s.scoreNumeric,
      scoreLetter: s.scoreLetter,
      description: s.description ?? '-',
    })),
    tahsinSummary: tahsinSummary ? {
      averageScore: tahsinSummary.averageScore,
      lastMaterial: tahsinSummary.lastMaterial,
    } : null,
    tahfidz: tahfidzScores.map((s) => ({
      surahName: s.surah.name,
      scoreNumeric: s.scoreNumeric,
      scoreLetter: s.scoreLetter,
      description: s.description ?? '-',
    })),
    tahfidzSummary: tahfidzSummary ? {
      averageScore: tahfidzSummary.averageScore,
    } : null,
  };
}