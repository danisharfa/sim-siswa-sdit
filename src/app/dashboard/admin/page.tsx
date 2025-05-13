import { prisma } from '@/lib/prisma';
import { DashboardStats } from '@/components/dashboard-stats';

export default async function AdminDashboardPage() {
  const [totalCoordinator, totalTeachers, totalStudents, totalClassrooms, totalGroups] =
    await Promise.all([
      prisma.user.count({ where: { role: 'coordinator' } }),
      prisma.user.count({ where: { role: 'teacher' } }),
      prisma.user.count({ where: { role: 'student' } }),
      prisma.classroom.count(),
      prisma.group.count(),
    ]);

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>

      <DashboardStats
        totalCoordinator={totalCoordinator}
        totalTeachers={totalTeachers}
        totalStudents={totalStudents}
        totalClassrooms={totalClassrooms}
        totalGroups={totalGroups}
      />
    </div>
  );
}
