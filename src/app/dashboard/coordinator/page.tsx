import { requireCoordinatorRole } from '@/lib/auth/require-role';
import { Management } from '@/components/coordinator/charts/Management';

export default async function CoordinatorDashboardPage() {
  const user = await requireCoordinatorRole();

  return (
    <div className="p-4">
      <div className="flex items-baseline gap-2 mb-4">
        <h1 className="text-2xl font-bold">{user.fullName}</h1>
        <span className="text-muted-foreground">{user.profile?.nip}</span>
      </div>
      <Management />
    </div>
  );
}
