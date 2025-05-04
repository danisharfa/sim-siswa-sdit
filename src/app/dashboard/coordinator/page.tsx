import { requireRole } from '@/lib/auth/require-role';

export default async function CoordinatorDashboardPage() {
  const user = await requireRole('coordinator');

  return (
    <div className="p-6 space-y-4">
      <p className="mt-2 text-lg">Selamat Datang, {user.fullName}!</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6"></div>
    </div>
  );
}
