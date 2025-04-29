'use client';

import { useUser } from '@/lib/context/user-context';
import { Chart } from '@/components/teacher/charts/chart';

export default function TeacherDashboardContent() {
  const user = useUser();

  return (
    <div className="p-6 space-y-4">
      <p className="mt-2 text-lg">Selamat Datang, {user.namaLengkap}!</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Chart />
      </div>
    </div>
  );
}
