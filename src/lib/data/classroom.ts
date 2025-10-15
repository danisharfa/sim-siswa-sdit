import { prisma } from '@/lib/prisma';

export async function getClassroomById(id: string) {
  try {
    return await prisma.classroom.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error('Error fetching classroom data:', error);
    return null;
  }
}

export async function getClassroomHistoryById(id: string) {
  try {
    // Jika `id` adalah classroomId dan kita ingin mendapatkan satu record saja
    const classroomHistory = await prisma.classroomHistory.findFirst({
      where: { classroomId: id },
      include: {
        classroom: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!classroomHistory) return null;

    return {
      id: classroomHistory.classroomId,
      name: classroomHistory.classroom.name,
      academicYear: classroomHistory.academicYear,
      semester: classroomHistory.semester,
    };
  } catch (error) {
    console.error('Error fetching classroom history data:', error);
    return null;
  }
}

export function addOneYearToAcademicYear(academicYear: string): string {
  const [start, end] = academicYear.split('/').map((s) => parseInt(s));
  if (isNaN(start) || isNaN(end)) return academicYear;
  return `${start + 1}/${end + 1}`;
}
