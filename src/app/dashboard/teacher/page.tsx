import { requireRole } from '@/lib/auth/require-role';
import { Chart } from '@/components/teacher/charts/chart';
import { WafaChart } from '@/components/teacher/charts/wafa-chart';

export default async function TeacherDashboardPage() {
  const user = await requireRole('teacher');

  return (
    <div className="p-6 space-y-4">
      <p className="mt-2 text-lg">Selamat Datang, {user.fullName}!</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Chart />
        <WafaChart />
      </div>
    </div>
  );
}
