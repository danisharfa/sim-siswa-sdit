import { requireRole } from '@/lib/auth/require-role';
import { Role } from '@prisma/client';

export default async function StudentDashboardPage() {
  const user = await requireRole(Role.student);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-3xl font-bold">Student Dashboard</h1>
      <p className="mt-2 text-lg">Welcome, {user.fullName}!</p>
    </div>
  );
}
