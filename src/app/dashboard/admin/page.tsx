import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { DashboardStats } from '@/components/admin/stats/DashboardStats';

export default async function AdminDashboardPage() {
  const [
    totalCoordinator,
    totalTeachers,
    totalStudents,
    totalClassrooms,
    totalGroups,
    academicSetting,
  ] = await Promise.all([
    prisma.user.count({ where: { role: Role.coordinator } }),
    prisma.user.count({ where: { role: Role.teacher } }),
    prisma.studentProfile.count({
      where: {
        status: 'AKTIF',
      },
    }),
    prisma.classroom.count({ where: { isActive: true } }),
    prisma.group.count(),
    prisma.academicSetting.findUnique({
      where: { id: 'default' },
      select: {
        currentYear: true,
        currentSemester: true,
      },
    }),
  ]);

  const currentPeriod = {
    academicYear: academicSetting?.currentYear || 'Tidak diatur',
    semester: academicSetting?.currentSemester || 'GANJIL',
  };

  return (
    <div className="p-4">
      <DashboardStats
        totalCoordinator={totalCoordinator}
        totalTeachers={totalTeachers}
        totalStudents={totalStudents}
        totalClassrooms={totalClassrooms}
        totalGroups={totalGroups}
        currentPeriod={currentPeriod}
      />
    </div>
  );
}
