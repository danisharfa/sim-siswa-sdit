import { requireStudentRole } from '@/lib/auth/require-role';
import { MunaqasyahResultManagement } from '@/components/student/munaqasyah/result/MunaqasyahResultManagement';

export const dynamic = 'force-dynamic';

export default async function StudentMunaqasyahResultPage() {
  const user = await requireStudentRole();

  return (
    <div className="p-4">
      <div className="flex items-baseline gap-2 mb-4">
        <h1 className="text-2xl font-bold">Munaqasyah</h1>
        <span className="text-muted-foreground">{user.profile?.nis}</span>
      </div>
      <MunaqasyahResultManagement />
    </div>
  );
}
