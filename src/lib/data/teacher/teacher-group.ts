import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role, Semester } from '@prisma/client';

export async function fetchTeacherGroups() {
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

    const groups = await prisma.group.findMany({
      where: {
        teacherGroups: {
          some: { teacherId: teacher.id },
        },
        classroom: {
          isActive: true,
        },
      },
      include: {
        classroom: {
          select: { name: true, academicYear: true, semester: true },
        },
        students: {
          select: { id: true },
        },
      },
    });

    return groups.map((group) => ({
      groupId: group.id,
      groupName: group.name,
      classroomName: group.classroom.name,
      classroomAcademicYear: group.classroom.academicYear,
      classroomSemester: group.classroom.semester,
      totalMember: group.students.length,
    }));
  } catch (error) {
    console.error('[FETCH_TEACHER_GROUPS]', error);
    throw new Error('Gagal mengambil data kelompok binaan');
  }
}

export async function fetchTeacherGroupHistory() {
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

    const histories = await prisma.groupHistory.findMany({
      where: {
        teacherId: teacher.id,
      },
      orderBy: [{ academicYear: 'desc' }, { semester: 'desc' }, { group: { name: 'asc' } }],
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
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    });

    type StudentItem = {
      id: string;
      nis: string;
      fullName: string;
    };

    type GroupedHistory = {
      groupId: string;
      groupName: string;
      classroomName: string;
      academicYear: string;
      semester: Semester;
      students: StudentItem[];
    };

    const grouped = histories.reduce((acc, curr) => {
      const key = `${curr.groupId}-${curr.academicYear}-${curr.semester}`;
      if (!acc[key]) {
        acc[key] = {
          groupId: curr.groupId,
          groupName: curr.group.name,
          classroomName: curr.group.classroom.name,
          academicYear: curr.academicYear,
          semester: curr.semester as Semester,
          students: [],
        };
      }
      acc[key].students.push({
        id: curr.student.id,
        nis: curr.student.nis,
        fullName: curr.student.user.fullName,
      });
      return acc;
    }, {} as Record<string, GroupedHistory>);

    return Object.values(grouped);
  } catch (error) {
    console.error('[FETCH_TEACHER_GROUP_HISTORY]', error);
    throw new Error('Gagal mengambil data riwayat kelompok');
  }
}
