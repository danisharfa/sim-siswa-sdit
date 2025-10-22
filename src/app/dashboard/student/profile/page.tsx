import { requireRole } from '@/lib/auth/require-role';
import StudentProfileDetail from '@/components/student/profile/StudentProfileDetail';
import { Role } from '@prisma/client';

export default async function StudentProfilePage() {
  const user = await requireRole(Role.student);

  return (
    <div className="p-4">
      <div className="flex items-baseline gap-2 mb-4">
        <h1 className="text-2xl font-bold">Biodata</h1>
        <span className="text-muted-foreground">{user.username}</span>
      </div>
      <StudentProfileDetail userId={user.id} />
    </div>
  );
}
