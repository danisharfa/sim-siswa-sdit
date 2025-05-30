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
  groupId?: string // Parameter tambahan untuk group history
): Promise<StudentReportHistoryData[] | null> {
  // Pertama, ambil data student
  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    include: {
      user: true,
      classroom: true,
      group: true,
      tahsinScores: true,
      tahsinSummaries: true,
      tahfidzScores: {
        include: {
          surah: true,
        },
      },
      tahfidzSummaries: true,
    },
  });

  if (!student) return null;

  // Debug: Check groupId
  console.log('Student current groupId:', student.groupId);
  console.log('Group history groupId from URL:', groupId);

  // Query untuk mengambil data teacher dari group history
  const [coordinator, groupHistoryWithTeacher] = await Promise.all([
    prisma.coordinatorProfile.findFirst({
      where: {
        user: {
          role: Role.coordinator,
        },
      },
      include: {
        user: { select: { fullName: true } },
      },
    }),
    // Query group history untuk mendapatkan teacher pada group dan periode tertentu
    groupId
      ? prisma.groupHistory.findFirst({
          where: {
            groupId,
            studentId: studentId,
          },
          include: {
            teacher: {
              include: {
                user: true,
              },
            },
            group: {
              include: {
                classroom: true,
              },
            },
          },
        })
      : null,
  ]);

  // Debug: Check group history data
  console.log('GroupHistory found:', {
    hasGroupHistory: !!groupHistoryWithTeacher,
    teacherName: groupHistoryWithTeacher?.teacher?.user?.fullName || 'Not found from group history',
    academicYear: groupHistoryWithTeacher?.academicYear,
    semester: groupHistoryWithTeacher?.semester,
  });

  // Ambil nama teacher dari group history, atau fallback ke teacherGroup query jika tidak ada
  let teacherName = '-';

  if (groupHistoryWithTeacher?.teacher?.user?.fullName) {
    teacherName = groupHistoryWithTeacher.teacher.user.fullName;
  } else if (groupId) {
    // Fallback: cari teacher dari teacherGroup jika tidak ada di groupHistory
    const teacherGroup = await prisma.teacherGroup.findFirst({
      where: {
        groupId,
      },
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
      },
    });
    teacherName = teacherGroup?.teacher?.user?.fullName ?? '-';
  }

  const coordinatorName = coordinator?.user.fullName ?? '-';
  const fullName = student.user.fullName;
  const nis = student.nis;
  const nisn = student.nisn ?? '-';
  const address = student.address ?? '-';
  const className = student.classroom?.name ?? '-';

  // Debug final result
  console.log('Final teacher name:', teacherName);

  // Kelompokkan data berdasarkan tahun ajaran dan semester
  const grouped: Record<string, StudentReportHistoryData> = {};

  student.tahsinScores.forEach((s) => {
    const key = `${s.academicYear}__${s.semester}`;
    if (!grouped[key])
      grouped[key] = {
        fullName,
        nis,
        nisn,
        address,
        className,
        academicYear: s.academicYear,
        semester: s.semester,
        teacherName,
        coordinatorName,
        tahsin: [],
        tahsinSummary: null,
        tahfidz: [],
        tahfidzSummary: null,
      };
    grouped[key].tahsin.push({
      topic: s.topic,
      scoreNumeric: s.scoreNumeric,
      scoreLetter: s.scoreLetter,
      description: s.description ?? '-',
    });
  });

  student.tahsinSummaries.forEach((s) => {
    const key = `${s.academicYear}__${s.semester}`;
    if (!grouped[key])
      grouped[key] = {
        fullName,
        nis,
        nisn,
        address,
        className,
        academicYear: s.academicYear,
        semester: s.semester,
        teacherName,
        coordinatorName,
        tahsin: [],
        tahsinSummary: null,
        tahfidz: [],
        tahfidzSummary: null,
      };
    grouped[key].tahsinSummary = {
      averageScore: s.averageScore,
      lastMaterial: s.lastMaterial,
    };
  });

  student.tahfidzScores.forEach((s) => {
    const key = `${s.academicYear}__${s.semester}`;
    if (!grouped[key])
      grouped[key] = {
        fullName,
        nis,
        nisn,
        address,
        className,
        academicYear: s.academicYear,
        semester: s.semester,
        teacherName,
        coordinatorName,
        tahsin: [],
        tahsinSummary: null,
        tahfidz: [],
        tahfidzSummary: null,
      };
    grouped[key].tahfidz.push({
      surahName: s.surah.name,
      scoreNumeric: s.scoreNumeric,
      scoreLetter: s.scoreLetter,
      description: s.description ?? '-',
    });
  });

  student.tahfidzSummaries.forEach((s) => {
    const key = `${s.academicYear}__${s.semester}`;
    if (!grouped[key])
      grouped[key] = {
        fullName,
        nis,
        nisn,
        address,
        className,
        academicYear: s.academicYear,
        semester: s.semester,
        teacherName,
        coordinatorName,
        tahsin: [],
        tahsinSummary: null,
        tahfidz: [],
        tahfidzSummary: null,
      };
    grouped[key].tahfidzSummary = {
      averageScore: s.averageScore,
    };
  });

  return Object.values(grouped);
}
