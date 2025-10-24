import { requireStudentRole } from '@/lib/auth/require-role';
import { TashihScheduleManagement } from '@/components/student/tashih/schedule/TashihScheduleManagement';

export const dynamic = 'force-dynamic';

export default async function StudentTashihSchedulePage() {
  const user = await requireStudentRole();

  return (
    <div className="p-4">
      <div className="flex items-baseline gap-2 mb-4">
        <h1 className="text-2xl font-bold">Tashih</h1>
        <span className="text-muted-foreground">{user.profile?.nis}</span>
      </div>
      <TashihScheduleManagement />
    </div>
  );
}
