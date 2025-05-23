import { prisma } from '@/lib/prisma';
import { Semester } from '@prisma/client';

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

export async function getStudentReportData(studentId: string): Promise<StudentReportData | null> {
  const setting = await prisma.academicSetting.findFirst();
  if (!setting) return null;

  const [student, coordinator] = await Promise.all([
    prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        classroom: true,
        group: {
          include: {
            teacherGroups: {
              include: {
                teacher: {
                  include: { user: true },
                },
              },
            },
          },
        },
        tahsinScores: {
          where: {
            academicYear: setting.currentYear,
            semester: setting.currentSemester,
          },
        },
        tahsinSummaries: {
          where: {
            academicYear: setting.currentYear,
            semester: setting.currentSemester,
          },
          take: 1,
        },
        tahfidzScores: {
          where: {
            academicYear: setting.currentYear,
            semester: setting.currentSemester,
          },
          include: {
            surah: true,
          },
        },
        tahfidzSummaries: {
          where: {
            academicYear: setting.currentYear,
            semester: setting.currentSemester,
          },
          take: 1,
        },
      },
    }),
    prisma.coordinatorProfile.findFirst({
      where: {
        user: {
          role: 'coordinator',
        },
      },
      include: {
        user: true,
      },
    }),
  ]);

  if (!student) return null;

  const teacherName = student.group?.teacherGroups?.[0]?.teacher?.user.fullName ?? '-';
  const coordinatorName = coordinator?.user.fullName ?? '-';

  return {
    fullName: student.user.fullName,
    nis: student.nis,
    nisn: student.nisn ?? '-',
    address: student.address ?? '-',
    className: student.classroom?.name ?? '-',
    semester: setting.currentSemester,
    academicYear: setting.currentYear,
    teacherName,
    coordinatorName,
    tahsin: student.tahsinScores.map((s) => ({
      topic: s.topic,
      scoreNumeric: s.scoreNumeric,
      scoreLetter: s.scoreLetter,
      description: s.description ?? '-',
    })),
    tahsinSummary: {
      averageScore: student.tahsinSummaries[0]?.averageScore ?? null,
      lastMaterial: student.tahsinSummaries[0]?.lastMaterial ?? null,
    },
    tahfidz: student.tahfidzScores.map((s) => ({
      surahName: s.surah.name,
      scoreNumeric: s.scoreNumeric,
      scoreLetter: s.scoreLetter,
      description: s.description ?? '-',
    })),
    tahfidzSummary: {
      averageScore: student.tahfidzSummaries[0]?.averageScore ?? null,
    },
  };
}
