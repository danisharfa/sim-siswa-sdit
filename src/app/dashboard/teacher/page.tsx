import { requireRole } from '@/lib/auth/require-role';
import { AlquranChart } from '@/components/teacher/charts/alquran-chart';
import { WafaChart } from '@/components/teacher/charts/wafa-chart';
import { Role } from '@prisma/client';

export default async function TeacherDashboardPage() {
  const user = await requireRole(Role.teacher);

  return (
    <div className="p-6 space-y-4">
      <p className="mt-2 text-lg">Selamat Datang, {user.fullName}!</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AlquranChart />
        <WafaChart />
      </div>
    </div>
  );
}
