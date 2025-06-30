import { requireRole } from '@/lib/auth/require-role';
import { Role } from '@prisma/client';
import { Management } from '@/components/coordinator/charts/Management';

export default async function CoordinatorDashboardPage() {
  const user = await requireRole(Role.coordinator);

  return (
    <div className="p-4">
      <div className="flex items-baseline gap-2 mb-4">
        <h1 className="text-2xl font-bold">{user.fullName}</h1>
        <span className="text-muted-foreground">{user.role.toUpperCase()}</span>
      </div>
      <Management />
    </div>
  );
}
