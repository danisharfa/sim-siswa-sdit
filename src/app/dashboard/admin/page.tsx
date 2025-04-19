import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DashboardStats } from '@/components/dashboard-stats';

export default async function AdminDashboard() {
  const user = await getUser();

  if (!user || user.role !== 'admin') {
    return redirect('/login');
  }

  const [totalStudents, totalTeachers, totalClassrooms, totalGroups] =
    await Promise.all([
      prisma.user.count({ where: { role: 'student' } }),
      prisma.user.count({ where: { role: 'teacher' } }),
      prisma.kelas.count(),
      prisma.kelompok.count(), // Placeholder for total groups
    ]);

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="mt-2 text-lg">Welcome, {user.username}!</p>
      </div>

      <DashboardStats
        totalStudents={totalStudents}
        totalTeachers={totalTeachers}
        totalClassrooms={totalClassrooms}
        totalGroups={totalGroups} // Placeholder for total groups
      />
    </div>
  );
}
