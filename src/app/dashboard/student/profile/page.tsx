import { requireRole } from '@/lib/auth/require-role';

import StudentProfileDetail from '@/components/student/profile/detail';
import { Role } from '@prisma/client';

export default async function StudentProfilePage() {
  const user = await requireRole(Role.student);

  return (
    <div className="p-4">
      <div className="flex items-baseline gap-2 mb-4">
        <h1 className="text-2xl font-bold">{user.fullName}</h1>
        <span className="text-muted-foreground">Biodata</span>
      </div>
      <StudentProfileDetail userId={user.id} />
    </div>
  );
}
