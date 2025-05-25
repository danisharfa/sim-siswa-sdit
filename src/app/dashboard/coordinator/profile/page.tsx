import { requireRole } from '@/lib/auth/require-role';
import CoordinatorProfileDetail from '@/components/coordinator/profile/detail';
import { Role } from '@prisma/client';

export default async function CoordinatorProfilePage() {
  const user = await requireRole(Role.coordinator);

  return (
    <div className="p-4">
      <div className="flex items-baseline gap-2 mb-4">
        <h1 className="text-2xl font-bold">{user.fullName}</h1>
        <span className="text-muted-foreground">Biodata</span>
      </div>
      <CoordinatorProfileDetail userId={user.id} />
    </div>
  );
}
