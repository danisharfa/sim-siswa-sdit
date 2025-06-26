import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role, Semester } from '@prisma/client';

export interface StudentReportData {
  fullName: string;
  nis: string;
  nisn: string;
  address: string | null;
  academicPeriods: {
    academicYear: string;
    semester: Semester;
    className: string;
    teacherName: string;
  }[];
  schoolInfo: {
    schoolName: string;
    currrentPrincipalName: string;
  };
  coordinatorName: string;
  allReports: {
    academicYear: string;
    semester: Semester;
    className: string;
    teacherName: string;
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
  }[];
}

export async function fetchReportData() {
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

    // Get all tahsin and tahfidz scores to determine periods (similar to submissions approach)
    const [allTahsinScores, allTahfidzScores] = await Promise.all([
      prisma.tahsinScore.findMany({
        where: { studentId: student.id },
        include: {
          group: {
            include: {
              classroom: {
                select: {
                  name: true,
                  academicYear: true,
                  semester: true,
                },
              },
              teacherGroups: {
                include: {
                  teacher: {
                    include: { user: { select: { fullName: true } } },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.tahfidzScore.findMany({
        where: { studentId: student.id },
        include: {
          surah: true,
          group: {
            include: {
              classroom: {
                select: {
                  name: true,
                  academicYear: true,
                  semester: true,
                },
              },
              teacherGroups: {
                include: {
                  teacher: {
                    include: { user: { select: { fullName: true } } },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    // Also get reports to include any periods that might only have reports
    const allReports = await prisma.report.findMany({
      where: { studentId: student.id },
      include: {
        group: {
          include: {
            classroom: {
              select: {
                name: true,
                academicYear: true,
                semester: true,
              },
            },
            teacherGroups: {
              include: {
                teacher: {
                  include: { user: { select: { fullName: true } } },
                },
              },
            },
          },
        },
      },
    });

    const [coordinator, schoolInfo] = await Promise.all([
      prisma.coordinatorProfile.findFirst({
        where: {
          user: { role: Role.coordinator },
        },
        include: { user: { select: { fullName: true } } },
      }),
      prisma.academicSetting.findFirst({
        select: {
          schoolName: true,
          currentPrincipalName: true,
        },
      }),
    ]);

    // Extract unique academic periods from all sources
    const periodsMap = new Map();

    // From tahsin scores
    allTahsinScores.forEach((score) => {
      if (score.group.classroom) {
        const key = `${score.group.classroom.academicYear}-${score.group.classroom.semester}`;
        if (!periodsMap.has(key)) {
          periodsMap.set(key, {
            academicYear: score.group.classroom.academicYear,
            semester: score.group.classroom.semester,
            className: score.group.classroom.name,
            teacherName: score.group.teacherGroups?.[0]?.teacher?.user.fullName ?? '-',
            groupId: score.groupId,
          });
        }
      }
    });

    // From tahfidz scores
    allTahfidzScores.forEach((score) => {
      if (score.group.classroom) {
        const key = `${score.group.classroom.academicYear}-${score.group.classroom.semester}`;
        if (!periodsMap.has(key)) {
          periodsMap.set(key, {
            academicYear: score.group.classroom.academicYear,
            semester: score.group.classroom.semester,
            className: score.group.classroom.name,
            teacherName: score.group.teacherGroups?.[0]?.teacher?.user.fullName ?? '-',
            groupId: score.groupId,
          });
        }
      }
    });

    // From reports
    allReports.forEach((report) => {
      if (report.group.classroom) {
        const key = `${report.group.classroom.academicYear}-${report.group.classroom.semester}`;
        if (!periodsMap.has(key)) {
          periodsMap.set(key, {
            academicYear: report.group.classroom.academicYear,
            semester: report.group.classroom.semester,
            className: report.group.classroom.name,
            teacherName: report.group.teacherGroups?.[0]?.teacher?.user.fullName ?? '-',
            groupId: report.groupId,
          });
        }
      }
    });

    const academicPeriods = Array.from(periodsMap.values())
      .map((period) => period)
      .sort((a, b) => {
        // Sort by year desc, then by semester desc
        if (a.academicYear !== b.academicYear) {
          return b.academicYear.localeCompare(a.academicYear);
        }
        return b.semester.localeCompare(a.semester);
      });

    console.log('Academic Periods:', academicPeriods); // Debug log

    // Build report data for each period
    const reportData = Array.from(periodsMap.entries()).map(([periodKey, periodInfo]) => {
      const [academicYear, semester] = periodKey.split('-');

      // Filter scores for this period
      const tahsinForPeriod = allTahsinScores.filter(
        (score) => score.groupId === periodInfo.groupId
      );
      const tahfidzForPeriod = allTahfidzScores.filter(
        (score) => score.groupId === periodInfo.groupId
      );
      const reportForPeriod = allReports.find(
        (report) => report.groupId === periodInfo.groupId
      );

      return {
        academicYear,
        semester: semester as Semester,
        className: periodInfo.className,
        teacherName: periodInfo.teacherName,
        tahsin: tahsinForPeriod.map((s) => ({
          topic: s.topic,
          scoreNumeric: s.scoreNumeric,
          scoreLetter: s.scoreLetter,
          description: s.description ?? '-',
        })),
        tahfidz: tahfidzForPeriod.map((s) => ({
          surahName: s.surah.name,
          scoreNumeric: s.scoreNumeric,
          scoreLetter: s.scoreLetter,
          description: s.description ?? '-',
        })),
        report: {
          tahfidzScore: reportForPeriod?.tahfidzScore ?? null,
          tahsinScore: reportForPeriod?.tahsinScore ?? null,
          lastTahsinMaterial: reportForPeriod?.lastTahsinMaterial ?? null,
        },
      };
    });

    // Sort report data by academic year and semester
    const sortedReportData = reportData.sort((a, b) => {
      if (a.academicYear !== b.academicYear) {
        return b.academicYear.localeCompare(a.academicYear);
      }
      return b.semester.localeCompare(a.semester);
    });

    console.log('All Reports:', sortedReportData); // Debug log

    return {
      fullName: student.user.fullName,
      nis: student.nis,
      nisn: student.nisn ?? '-',
      address: student.address ?? '-',
      academicPeriods,
      coordinatorName: coordinator?.user?.fullName ?? '-',
      schoolInfo: {
        schoolName: schoolInfo?.schoolName ?? '-',
        currrentPrincipalName: schoolInfo?.currentPrincipalName ?? '-',
      },
      allReports: sortedReportData,
    };
  } catch (error) {
    console.error('[FETCH_REPORT_DATA]', error);
    throw new Error('Gagal mengambil data rapor');
  }
}