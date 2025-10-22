import { requireRole } from '@/lib/auth/require-role';
import { Role } from '@prisma/client';
import CoordinatorProfileDetail from '@/components/coordinator/profile/CoordinatorProfileDetail';

export default async function CoordinatorProfilePage() {
  const user = await requireRole(Role.coordinator);

  return (
    <div className="p-4">
      <div className="flex items-baseline gap-2 mb-4">
        <h1 className="text-2xl font-bold">Biodata</h1>
        <span className="text-muted-foreground">{user.username}</span>
      </div>
      <CoordinatorProfileDetail userId={user.id} />
    </div>
  );
}
