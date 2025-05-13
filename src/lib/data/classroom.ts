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

export function addOneYearToAcademicYear(academicYear: string): string {
  const [start, end] = academicYear.split('/').map((s) => parseInt(s));
  if (isNaN(start) || isNaN(end)) return academicYear;
  return `${start + 1}/${end + 1}`;
}
