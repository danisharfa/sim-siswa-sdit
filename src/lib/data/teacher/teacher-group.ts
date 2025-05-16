import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function fetchTeacherGroups() {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'teacher') {
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
