import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/require-role';
import { DashboardStats } from '@/components/dashboard-stats';

export default async function AdminDashboardPage() {
  const user = await requireRole('admin');

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
        <p className="mt-2 text-lg">Welcome, {user.username}!</p>
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
