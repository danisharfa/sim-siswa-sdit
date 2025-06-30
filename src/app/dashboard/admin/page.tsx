import { prisma } from '@/lib/prisma';
import { DashboardStats } from '@/components/admin/stats/DashboardStats';
import { Role } from '@prisma/client';

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
    prisma.user.count({ where: { role: Role.student } }),
    prisma.classroom.count(),
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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Kelola sistem informasi siswa dan pantau statistik umum
        </p>
      </div>

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
