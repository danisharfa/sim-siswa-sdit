import { requireRole } from '@/lib/auth/require-role';
import TeacherProfileDetail from '@/components/teacher/profile/detail';
import { Role } from '@prisma/client';

export default async function TeacherProfilePage() {
  const user = await requireRole(Role.teacher);

  return (
    <div className="p-4">
      <div className="flex items-baseline gap-2 mb-4">
        <h1 className="text-2xl font-bold">{user.fullName}</h1>
        <span className="text-muted-foreground">Biodata</span>
      </div>
      <TeacherProfileDetail userId={user.id} />
    </div>
  );
}
