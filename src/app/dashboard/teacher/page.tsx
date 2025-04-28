import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { Chart } from '@/components/teacher/charts/chart';

export default async function TeacherDashboard() {
  const user = await getUser();

  if (!user || user.role !== 'teacher') {
    return redirect('/login');
  }

  return (
    <div className="p-6 space-y-4">
      <p className="mt-2 text-lg">Selamat Datang, {user.namaLengkap}!</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Chart />
      </div>
    </div>
  );
}
